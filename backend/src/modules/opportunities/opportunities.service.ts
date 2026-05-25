import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OpportunityPropertyStatus, OpportunityStatus } from '../../common/enums';

import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityStageDto } from './dto/update-opportunity-stage.dto';
import { LinkOpportunityPropertyDto } from './dto/link-opportunity-property.dto';
import { OpportunityProperty } from './entities/opportunity-property.entity';
import { Opportunity } from './entities/opportunity.entity';
import { PipelinesService, stageNameToKey } from './pipelines.service';

export type OpportunityView = {
    id: string;
    name: string;
    email: string;
    phone: string;
    propertyId?: string;
    stage: string;
    createdAt: string;
    leadId: string;
    status: OpportunityStatus;
};

@Injectable()
export class OpportunitiesService {
    constructor(
        @InjectRepository(Opportunity)
        private readonly repository: Repository<Opportunity>,
        @InjectRepository(OpportunityProperty)
        private readonly opportunityPropertyRepo: Repository<OpportunityProperty>,
        private readonly pipelinesService: PipelinesService,
    ) {}

    private toView(opp: Opportunity, stageName?: string): OpportunityView {
        const contact = opp.lead?.contact;
        const name = contact ? `${contact.firstName} ${contact.lastName}`.trim() : 'Sin nombre';
        const propertyId =
            opp.candidateProperties?.find((p) => p.status === OpportunityPropertyStatus.SELECTED)?.propertyId ??
            opp.candidateProperties?.[0]?.propertyId;

        return {
            id: opp.id,
            name,
            email: contact?.email ?? '',
            phone: contact?.phone ?? '',
            propertyId,
            stage: stageName ? stageNameToKey(stageName) : 'nuevo',
            createdAt: opp.createdAt.toISOString(),
            leadId: opp.leadId,
            status: opp.status,
        };
    }

    private baseQuery(organizationId: string) {
        return this.repository
            .createQueryBuilder('opp')
            .leftJoinAndSelect('opp.lead', 'lead')
            .leftJoinAndSelect('lead.contact', 'contact')
            .leftJoinAndSelect('opp.stage', 'stage')
            .leftJoinAndSelect('opp.candidateProperties', 'candidateProperties')
            .where('opp.organizationId = :organizationId', { organizationId });
    }

    async findAll(organizationId: string) {
        const rows = await this.baseQuery(organizationId).orderBy('opp.createdAt', 'DESC').getMany();
        return rows.map((opp) => this.toView(opp, opp.stage?.name));
    }

    async getBoard(organizationId: string) {
        await this.pipelinesService.ensureDefaultPipeline(organizationId);
        const pipeline = await this.pipelinesService.getDefaultPipeline(organizationId);
        if (!pipeline) return { stages: [], pipeline: null };

        const opps = await this.baseQuery(organizationId).orderBy('opp.createdAt', 'DESC').getMany();

        const stages = pipeline.stages.map((stage) => ({
            key: stageNameToKey(stage.name),
            name: stage.name,
            order: stage.order,
            items: opps.filter((o) => o.stageId === stage.id).map((o) => this.toView(o, stage.name)),
        }));

        return { pipeline: { id: pipeline.id, name: pipeline.name }, stages };
    }

    async create(organizationId: string, ownerUserId: string, dto: CreateOpportunityDto) {
        await this.pipelinesService.ensureDefaultPipeline(organizationId);
        const pipeline = await this.pipelinesService.getDefaultPipeline(organizationId);
        if (!pipeline) throw new NotFoundException('Pipeline not found');

        const stageKey = dto.stageKey ?? 'visita';
        const stage = await this.pipelinesService.getStageByKey(organizationId, stageKey);
        if (!stage) throw new NotFoundException('Stage not found');

        const opp = this.repository.create({
            organizationId,
            leadId: dto.leadId,
            ownerUserId,
            pipelineId: pipeline.id,
            stageId: stage.id,
            status: OpportunityStatus.OPEN,
        });
        const saved = await this.repository.save(opp);

        if (dto.propertyId) {
            await this.opportunityPropertyRepo.save(
                this.opportunityPropertyRepo.create({
                    opportunityId: saved.id,
                    propertyId: dto.propertyId,
                    status: OpportunityPropertyStatus.SUGGESTED,
                }),
            );
        }

        const full = await this.baseQuery(organizationId)
            .andWhere('opp.id = :id', { id: saved.id })
            .getOne();
        return this.toView(full!, stage.name);
    }

    async updateStage(organizationId: string, id: string, dto: UpdateOpportunityStageDto) {
        const opp = await this.repository.findOne({ where: { id, organizationId }, relations: { stage: true, lead: { contact: true }, candidateProperties: true } });
        if (!opp) throw new NotFoundException('Opportunity not found');

        const stage = await this.pipelinesService.getStageByKey(organizationId, dto.stageKey);
        if (!stage) throw new NotFoundException('Stage not found');

        opp.stageId = stage.id;
        if (dto.stageKey === 'ganado') opp.status = OpportunityStatus.WON;
        if (dto.stageKey === 'perdido') opp.status = OpportunityStatus.LOST;

        await this.repository.save(opp);
        return this.toView({ ...opp, stage }, stage.name);
    }

    async linkProperty(organizationId: string, id: string, dto: LinkOpportunityPropertyDto) {
        const opp = await this.repository.findOne({ where: { id, organizationId } });
        if (!opp) throw new NotFoundException('Opportunity not found');

        const existing = await this.opportunityPropertyRepo.findOne({
            where: { opportunityId: id, propertyId: dto.propertyId },
        });
        if (existing) return existing;

        return this.opportunityPropertyRepo.save(
            this.opportunityPropertyRepo.create({
                opportunityId: id,
                propertyId: dto.propertyId,
                status: OpportunityPropertyStatus.SUGGESTED,
            }),
        );
    }

    async countOpen(organizationId: string) {
        return this.repository.count({
            where: { organizationId, status: OpportunityStatus.OPEN },
        });
    }
}
