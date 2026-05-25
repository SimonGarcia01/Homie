import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ActivityType, LeadStatus } from '../../common/enums';
import { ActivitiesService } from '../activities/activities.service';
import { ContactsService } from '../contacts/contacts.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { Opportunity } from '../opportunities/entities/opportunity.entity';

import { ConvertLeadDto, CreateLeadDto, UpdateLeadDto } from './dto/create-lead.dto';
import { Lead } from './entities/lead.entity';

export type LeadView = {
    id: string;
    name: string;
    email: string;
    phone: string;
    propertyId?: string;
    stage: string;
    createdAt: string;
};

@Injectable()
export class LeadsService {
    constructor(
        @InjectRepository(Lead)
        private readonly repository: Repository<Lead>,
        @InjectRepository(Opportunity)
        private readonly opportunityRepo: Repository<Opportunity>,
        private readonly contactsService: ContactsService,
        private readonly opportunitiesService: OpportunitiesService,
        private readonly activitiesService: ActivitiesService,
    ) {}

    private statusToStage(status: LeadStatus): string {
        if (status === LeadStatus.CONTACTED) return 'contactado';
        return 'nuevo';
    }

    private toView(lead: Lead): LeadView {
        const contact = lead.contact!;
        return {
            id: lead.id,
            name: `${contact.firstName} ${contact.lastName}`.trim(),
            email: contact.email ?? '',
            phone: contact.phone ?? '',
            stage: this.statusToStage(lead.status),
            createdAt: lead.createdAt.toISOString(),
        };
    }

    async findEarlyStage(organizationId: string, _status?: string) {
        const leads = await this.repository.find({
            where: {
                organizationId,
                status: In([LeadStatus.NEW, LeadStatus.CONTACTED]),
            },
            relations: { contact: true },
            order: { createdAt: 'DESC' },
        });

        const leadIds = leads.map((l) => l.id);
        const withOpportunity = leadIds.length
            ? await this.opportunityRepo
                  .createQueryBuilder('o')
                  .select('o.leadId')
                  .where('o.leadId IN (:...leadIds)', { leadIds })
                  .getRawMany<{ o_lead_id: string }>()
            : [];

        const converted = new Set(withOpportunity.map((r) => r.o_lead_id));

        return leads.filter((l) => !converted.has(l.id)).map((l) => this.toView(l));
    }

    async create(organizationId: string, ownerUserId: string, dto: CreateLeadDto) {
        const contact = await this.contactsService.create(organizationId, {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone,
        });

        const lead = await this.repository.save(
            this.repository.create({
                organizationId,
                contactId: contact.id,
                ownerUserId,
                source: dto.source?.trim() || 'manual',
                status: LeadStatus.NEW,
            }),
        );

        await this.activitiesService.create(organizationId, ownerUserId, {
            type: ActivityType.NOTE,
            content: 'Nuevo interesado registrado',
            leadId: lead.id,
            contactId: contact.id,
            propertyId: dto.propertyId,
        });

        const full = await this.repository.findOne({
            where: { id: lead.id },
            relations: { contact: true },
        });
        const view = this.toView(full!);
        if (dto.propertyId) view.propertyId = dto.propertyId;
        return view;
    }

    async update(organizationId: string, id: string, dto: UpdateLeadDto) {
        const lead = await this.repository.findOne({
            where: { id, organizationId },
            relations: { contact: true },
        });
        if (!lead) throw new NotFoundException('Lead not found');
        if (dto.status !== undefined) lead.status = dto.status;
        if (dto.temperature !== undefined) lead.temperature = dto.temperature;
        await this.repository.save(lead);
        return this.toView(lead);
    }

    async convert(organizationId: string, ownerUserId: string, id: string, dto: ConvertLeadDto) {
        const lead = await this.repository.findOne({ where: { id, organizationId } });
        if (!lead) throw new NotFoundException('Lead not found');

        lead.status = LeadStatus.QUALIFIED;
        await this.repository.save(lead);

        const opportunity = await this.opportunitiesService.create(organizationId, ownerUserId, {
            leadId: id,
            propertyId: dto.propertyId,
            stageKey: dto.stageKey ?? 'visita',
        });

        await this.activitiesService.create(organizationId, ownerUserId, {
            type: ActivityType.STAGE_CHANGE,
            content: 'Lead convertido a oportunidad',
            leadId: id,
            opportunityId: opportunity.id,
        });

        return opportunity;
    }

    async countByStatus(organizationId: string, status: 'new' | 'contacted') {
        const leadStatus = status === 'new' ? LeadStatus.NEW : LeadStatus.CONTACTED;
        const count = await this.repository.count({ where: { organizationId, status: leadStatus } });
        return { count };
    }
}
