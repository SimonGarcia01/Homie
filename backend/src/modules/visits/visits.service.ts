import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActivityType, OpportunityStatus, VisitStatus, VisitType } from '../../common/enums';
import { ActivitiesService } from '../activities/activities.service';
import { Lead } from '../leads/entities/lead.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';

import { CreateVisitDto } from './dto/create-visit.dto';
import { ScheduleVisitDto } from './dto/schedule-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { Visit } from './entities/visit.entity';

export type VisitView = {
    id: string;
    propertyId: string;
    leadId?: string;
    date: string;
    status: string;
    durationMin?: number;
    notes?: string;
    contactName?: string;
};

const STATUS_UI: Record<VisitStatus, string> = {
    [VisitStatus.PROPOSED]: 'programada',
    [VisitStatus.CONFIRMED]: 'programada',
    [VisitStatus.COMPLETED]: 'realizada',
    [VisitStatus.CANCELLED]: 'cancelada',
    [VisitStatus.NO_SHOW]: 'cancelada',
};

@Injectable()
export class VisitsService {
    constructor(
        @InjectRepository(Visit)
        private readonly repository: Repository<Visit>,
        @InjectRepository(Lead)
        private readonly leadsRepo: Repository<Lead>,
        @InjectRepository(Opportunity)
        private readonly opportunitiesRepo: Repository<Opportunity>,
        private readonly activitiesService: ActivitiesService,
        private readonly opportunitiesService: OpportunitiesService,
    ) {}

    private toView(visit: Visit): VisitView {
        return {
            id: visit.id,
            propertyId: visit.propertyId,
            leadId: visit.opportunity?.leadId,
            date: visit.scheduledAt?.toISOString() ?? visit.createdAt.toISOString(),
            status: STATUS_UI[visit.status] ?? 'programada',
            durationMin: visit.durationMin ?? undefined,
            notes: visit.notes ?? undefined,
            contactName: visit.contact
                ? `${visit.contact.firstName} ${visit.contact.lastName}`.trim()
                : undefined,
        };
    }

    private baseQuery(organizationId: string) {
        return this.repository
            .createQueryBuilder('visit')
            .leftJoinAndSelect('visit.contact', 'contact')
            .leftJoinAndSelect('visit.opportunity', 'opportunity')
            .leftJoinAndSelect('visit.property', 'property')
            .where('visit.organizationId = :organizationId', { organizationId });
    }

    async findAll(organizationId: string, from?: string, to?: string) {
        const qb = this.baseQuery(organizationId).orderBy('visit.scheduledAt', 'ASC');
        if (from) qb.andWhere('visit.scheduledAt >= :from', { from });
        if (to) qb.andWhere('visit.scheduledAt <= :to', { to });
        const rows = await qb.getMany();
        return rows.map((v) => this.toView(v));
    }

    async findUpcoming(organizationId: string, limit = 10) {
        const now = new Date();
        const rows = await this.baseQuery(organizationId)
            .andWhere('visit.scheduledAt >= :now', { now })
            .andWhere('visit.status IN (:...statuses)', {
                statuses: [VisitStatus.PROPOSED, VisitStatus.CONFIRMED],
            })
            .orderBy('visit.scheduledAt', 'ASC')
            .take(limit)
            .getMany();
        return rows.map((v) => this.toView(v));
    }

    async create(organizationId: string, agentUserId: string, dto: CreateVisitDto) {
        const visit = await this.repository.save(
            this.repository.create({
                organizationId,
                opportunityId: dto.opportunityId,
                propertyId: dto.propertyId,
                contactId: dto.contactId,
                agentUserId,
                visitType: dto.visitType,
                status: VisitStatus.CONFIRMED,
                scheduledAt: new Date(dto.scheduledAt),
                durationMin: dto.durationMin ?? 45,
                notes: dto.notes,
            }),
        );

        await this.activitiesService.create(organizationId, agentUserId, {
            type: ActivityType.VISIT,
            content: 'Visita agendada',
            visitId: visit.id,
            propertyId: dto.propertyId,
            contactId: dto.contactId,
        });

        const full = await this.baseQuery(organizationId).andWhere('visit.id = :id', { id: visit.id }).getOne();
        return this.toView(full!);
    }

    async scheduleFromLead(organizationId: string, agentUserId: string, dto: ScheduleVisitDto) {
        const lead = await this.leadsRepo.findOne({ where: { id: dto.leadId, organizationId } });
        if (!lead) throw new NotFoundException('Lead not found');

        const existing = await this.opportunitiesRepo.find({
            where: { organizationId, leadId: dto.leadId, status: OpportunityStatus.OPEN },
            order: { createdAt: 'DESC' },
            take: 1,
        });
        let opportunity = existing[0];

        if (!opportunity) {
            const created = await this.opportunitiesService.create(organizationId, agentUserId, {
                leadId: dto.leadId,
                propertyId: dto.propertyId,
                stageKey: 'visita',
            });
            opportunity = await this.opportunitiesRepo.findOneOrFail({ where: { id: created.id } });
        } else {
            await this.opportunitiesService.linkProperty(organizationId, opportunity.id, {
                propertyId: dto.propertyId,
            });
        }

        return this.create(organizationId, agentUserId, {
            opportunityId: opportunity.id,
            propertyId: dto.propertyId,
            contactId: lead.contactId,
            visitType: dto.visitType ?? VisitType.IN_PERSON,
            scheduledAt: dto.scheduledAt,
            durationMin: dto.durationMin,
            notes: dto.notes,
        });
    }

    async update(organizationId: string, id: string, dto: UpdateVisitDto) {
        const visit = await this.repository.findOne({ where: { id, organizationId }, relations: { contact: true, opportunity: true } });
        if (!visit) throw new NotFoundException('Visit not found');
        if (dto.status !== undefined) visit.status = dto.status;
        if (dto.scheduledAt !== undefined) visit.scheduledAt = new Date(dto.scheduledAt);
        if (dto.durationMin !== undefined) visit.durationMin = dto.durationMin;
        if (dto.notes !== undefined) visit.notes = dto.notes;
        await this.repository.save(visit);
        return this.toView(visit);
    }

    async countUpcoming(organizationId: string) {
        const now = new Date();
        const count = await this.repository.count({
            where: {
                organizationId,
                status: VisitStatus.CONFIRMED,
            },
        });
        return { count };
    }
}
