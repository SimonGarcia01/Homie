import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';

import { ActivityType, LeadStatus } from '../../common/enums';
import { ActivitiesService } from '../activities/activities.service';
import { ContactsService } from '../contacts/contacts.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { OpportunityProperty } from '../opportunities/entities/opportunity-property.entity';
import { ProspectInquiryStatus } from '../prospects/entities/prospect-inquiry.entity';
import { ProspectInquirySyncService } from '../prospects/prospect-inquiry-sync.service';

import { ConvertLeadDto, CreateLeadDto, UpdateLeadDto } from './dto/create-lead.dto';
import { Lead } from './entities/lead.entity';

export type LeadView = {
    id: string;
    name: string;
    email: string;
    phone: string;
    propertyId?: string;
    propertyTitle?: string;
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
        @InjectRepository(OpportunityProperty)
        private readonly opportunityPropertyRepo: Repository<OpportunityProperty>,
        private readonly contactsService: ContactsService,
        private readonly opportunitiesService: OpportunitiesService,
        private readonly activitiesService: ActivitiesService,
        private readonly inquirySync: ProspectInquirySyncService,
    ) {}

    private statusToStage(status: LeadStatus): string {
        if (status === LeadStatus.CONTACTED) return 'contactado';
        return 'nuevo';
    }

    private async resolvePropertyForLead(leadId: string): Promise<{ propertyId?: string; propertyTitle?: string }> {
        const link = await this.opportunityPropertyRepo
            .createQueryBuilder('op')
            .innerJoinAndSelect('op.property', 'property')
            .innerJoin('op.opportunity', 'opp', 'opp.leadId = :leadId', { leadId })
            .orderBy('op.id', 'DESC')
            .getOne();

        if (!link?.property) return {};
        return {
            propertyId: link.propertyId,
            propertyTitle: link.property.title,
        };
    }

    private async toViewAsync(lead: Lead): Promise<LeadView> {
        const contact = lead.contact!;
        const property = await this.resolvePropertyForLead(lead.id);
        return {
            id: lead.id,
            name: `${contact.firstName} ${contact.lastName}`.trim(),
            email: contact.email ?? '',
            phone: contact.phone ?? '',
            propertyId: property.propertyId,
            propertyTitle: property.propertyTitle,
            stage: this.statusToStage(lead.status),
            createdAt: lead.createdAt.toISOString(),
        };
    }

    async findOne(organizationId: string, id: string): Promise<LeadView> {
        const lead = await this.repository.findOne({
            where: { id, organizationId },
            relations: { contact: true },
        });
        if (!lead) throw new NotFoundException('Lead not found');
        return this.toViewAsync(lead);
    }

    async search(organizationId: string, query: string, limit = 10): Promise<LeadView[]> {
        const q = query.trim();
        if (!q) return [];

        const rows = await this.repository
            .createQueryBuilder('lead')
            .innerJoinAndSelect('lead.contact', 'contact')
            .where('lead.organizationId = :organizationId', { organizationId })
            .andWhere(
                new Brackets((qb) => {
                    qb.where('contact.firstName ILIKE :q', { q: `%${q}%` })
                        .orWhere('contact.lastName ILIKE :q', { q: `%${q}%` })
                        .orWhere('contact.email ILIKE :q', { q: `%${q}%` })
                        .orWhere('contact.phone ILIKE :q', { q: `%${q}%` });
                }),
            )
            .orderBy('lead.createdAt', 'DESC')
            .take(limit)
            .getMany();

        return Promise.all(rows.map((lead) => this.toViewAsync(lead)));
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

    async update(organizationId: string, userId: string, id: string, dto: UpdateLeadDto) {
        const lead = await this.repository.findOne({
            where: { id, organizationId },
            relations: { contact: true },
        });
        if (!lead) throw new NotFoundException('Lead not found');

        const becameContacted =
            dto.status === LeadStatus.CONTACTED && lead.status !== LeadStatus.CONTACTED;

        if (dto.status !== undefined) lead.status = dto.status;
        if (dto.temperature !== undefined) lead.temperature = dto.temperature;
        await this.repository.save(lead);

        if (becameContacted) {
            await this.activitiesService.create(organizationId, userId, {
                type: ActivityType.CALL,
                content: 'Lead contactado',
                leadId: id,
                contactId: lead.contactId,
            });
            const property = await this.resolvePropertyForLead(id);
            await this.inquirySync.syncByLead(id, property.propertyId, ProspectInquiryStatus.CONTACTED);
        }

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
