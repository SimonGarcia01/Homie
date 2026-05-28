import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChecklistItemStatus, RentalApplicationStatus } from '../../common/enums';
import { ApplicationChecklistItem } from '../documents/entities/application-checklist-item.entity';
import { DocumentType } from '../documents/entities/document-type.entity';
import { RentalContractsService } from '../rental-contracts/rental-contracts.service';
import { CreateRentalContractDto } from '../rental-contracts/dto/create-rental-contract.dto';
import { UpdateRentalContractDto } from '../rental-contracts/dto/update-rental-contract.dto';
import { RentalEvaluationsService } from '../rental-evaluations/rental-evaluations.service';
import { CreateRentalEvaluationDto } from '../rental-evaluations/dto/create-rental-evaluation.dto';

import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateRentalApplicationDto } from './dto/update-rental-application.dto';
import { RentalApplication } from './entities/rental-application.entity';
import { ApplicationChecklistService } from '../documents/application-checklist.service';

export type ApplicationView = {
    id: string;
    opportunityId: string;
    propertyId: string;
    status: RentalApplicationStatus;
    createdAt: string;
    propertyTitle?: string;
    leadName?: string;
};

export type ChecklistItemView = {
    id: string;
    status: ChecklistItemStatus;
    documentType: { id: string; key: string; label: string };
    document?: { id: string; name: string; downloadUrl: string; status: string };
};

export type ApplicationDetailView = ApplicationView & {
    checklistItems: ChecklistItemView[];
    evaluation?: {
        id: string;
        recommendation: string;
        notes?: string;
        createdAt: string;
    };
    contract?: {
        id: string;
        status: string;
        startDate: string;
        endDate: string;
        monthlyRent: string;
        signedAt?: string;
    };
    property?: { id: string; title: string };
    lead?: { id: string; name: string; email?: string };
};

const DOC_STATUS_UI: Record<ChecklistItemStatus, string> = {
    [ChecklistItemStatus.PENDING]: 'pendiente',
    [ChecklistItemStatus.RECEIVED]: 'pendiente',
    [ChecklistItemStatus.APPROVED]: 'verificado',
    [ChecklistItemStatus.REJECTED]: 'rechazado',
    [ChecklistItemStatus.EXPIRED]: 'vencido',
};

@Injectable()
export class RentalApplicationsService {
    constructor(
        @InjectRepository(RentalApplication)
        private readonly repository: Repository<RentalApplication>,
        @InjectRepository(ApplicationChecklistItem)
        private readonly checklistRepo: Repository<ApplicationChecklistItem>,
        private readonly checklistService: ApplicationChecklistService,
        private readonly evaluationsService: RentalEvaluationsService,
        private readonly contractsService: RentalContractsService,
    ) {}

    private toView(app: RentalApplication): ApplicationView {
        const contact = app.opportunity?.lead?.contact;
        return {
            id: app.id,
            opportunityId: app.opportunityId,
            propertyId: app.propertyId,
            status: app.status,
            createdAt: app.createdAt.toISOString(),
            propertyTitle: app.property?.title,
            leadName: contact ? `${contact.firstName} ${contact.lastName}`.trim() : undefined,
        };
    }

    private toChecklistView(item: ApplicationChecklistItem): ChecklistItemView {
        return {
            id: item.id,
            status: item.status,
            documentType: {
                id: item.documentType!.id,
                key: item.documentType!.key,
                label: item.documentType!.label,
            },
            document: item.document
                ? {
                      id: item.document.id,
                      name: item.document.originalFilename,
                      downloadUrl: `/api/documents/${item.document.id}/download`,
                      status: DOC_STATUS_UI[item.document.status] ?? 'pendiente',
                  }
                : undefined,
        };
    }

    private async toDetailView(app: RentalApplication): Promise<ApplicationDetailView> {
        const contact = app.opportunity?.lead?.contact;
        const evaluation = await this.evaluationsService.findByApplication(app.id);
        const contract = await this.contractsService.findByApplication(app.id);

        return {
            ...this.toView(app),
            property: app.property ? { id: app.property.id, title: app.property.title } : undefined,
            lead: contact
                ? {
                      id: contact.id,
                      name: `${contact.firstName} ${contact.lastName}`.trim(),
                      email: contact.email,
                  }
                : undefined,
            checklistItems: (app.checklistItems ?? []).map((item) => this.toChecklistView(item)),
            evaluation: evaluation
                ? {
                      id: evaluation.id,
                      recommendation: evaluation.recommendation,
                      notes: evaluation.notes,
                      createdAt: evaluation.createdAt,
                  }
                : undefined,
            contract: contract ?? undefined,
        };
    }

    private baseQuery() {
        return this.repository
            .createQueryBuilder('app')
            .leftJoinAndSelect('app.property', 'property')
            .leftJoinAndSelect('app.opportunity', 'opportunity')
            .leftJoinAndSelect('opportunity.lead', 'lead')
            .leftJoinAndSelect('lead.contact', 'contact')
            .orderBy('app.createdAt', 'DESC');
    }

    private detailQuery() {
        return this.baseQuery()
            .leftJoinAndSelect('app.checklistItems', 'checklistItems')
            .leftJoinAndSelect('checklistItems.documentType', 'documentType')
            .leftJoinAndSelect('checklistItems.document', 'document')
            .addOrderBy('documentType.label', 'ASC');
    }

    async findAll(status?: RentalApplicationStatus) {
        const qb = this.baseQuery();
        if (status) {
            qb.andWhere('app.status = :status', { status });
        }
        const rows = await qb.getMany();
        return rows.map((app) => this.toView(app));
    }

    async findPending() {
        return this.findAll(RentalApplicationStatus.PENDING_DOCUMENTS);
    }

    async countPending() {
        const count = await this.repository.count({
            where: { status: RentalApplicationStatus.PENDING_DOCUMENTS },
        });
        return { count };
    }

    async create(dto: { opportunityId: string; propertyId: string }) {
        const existing = await this.repository.findOne({
            where: {
                opportunityId: dto.opportunityId,
                propertyId: dto.propertyId,
            },
        });
        if (existing) {
            const full = await this.detailQuery().andWhere('app.id = :id', { id: existing.id }).getOne();
            return this.toDetailView(full!);
        }

        const app = await this.repository.save(
            this.repository.create({
                opportunityId: dto.opportunityId,
                propertyId: dto.propertyId,
                status: RentalApplicationStatus.PENDING_DOCUMENTS,
            }),
        );

        await this.checklistService.seedDefaultChecklist(app.id);

        const full = await this.detailQuery().andWhere('app.id = :id', { id: app.id }).getOne();
        return this.toDetailView(full!);
    }

    async findOne(id: string): Promise<ApplicationDetailView> {
        await this.checklistService.seedDefaultChecklist(id);
        const app = await this.detailQuery().andWhere('app.id = :id', { id }).getOne();
        if (!app) throw new NotFoundException('Application not found');
        return this.toDetailView(app);
    }

    async update(id: string, dto: UpdateRentalApplicationDto) {
        const app = await this.repository.findOne({ where: { id } });
        if (!app) throw new NotFoundException('Application not found');
        if (dto.status !== undefined) app.status = dto.status;
        await this.repository.save(app);
        return this.findOne(id);
    }

    async updateChecklistItem(applicationId: string, itemId: string, dto: UpdateChecklistItemDto) {
        const item = await this.checklistRepo.findOne({
            where: { id: itemId, rentalApplicationId: applicationId },
        });
        if (!item) throw new NotFoundException('Checklist item not found');

        item.status = dto.status;
        await this.checklistRepo.save(item);
        await this.checklistService.syncApplicationStatusFromChecklist(applicationId);
        return this.findOne(applicationId);
    }

    async createEvaluation(applicationId: string, userId: string, dto: CreateRentalEvaluationDto) {
        await this.evaluationsService.create(applicationId, userId, dto);
        return this.findOne(applicationId);
    }

    async getEvaluation(applicationId: string) {
        const evaluation = await this.evaluationsService.findByApplication(applicationId);
        if (!evaluation) throw new NotFoundException('Evaluation not found');
        return evaluation;
    }

    async createContract(applicationId: string, dto: CreateRentalContractDto) {
        await this.contractsService.create(applicationId, dto);
        return this.findOne(applicationId);
    }

    async updateContract(applicationId: string, dto: UpdateRentalContractDto) {
        await this.contractsService.update(applicationId, dto);
        return this.findOne(applicationId);
    }

    syncApplicationStatusFromChecklist(applicationId: string) {
        return this.checklistService.syncApplicationStatusFromChecklist(applicationId);
    }

    linkDocumentToChecklistItem(checklistItemId: string, documentId: string, applicationId: string) {
        return this.checklistService.linkDocumentToChecklistItem(checklistItemId, documentId, applicationId);
    }
}
