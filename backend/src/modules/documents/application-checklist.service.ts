import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChecklistItemStatus, RentalApplicationStatus } from '../../common/enums';
import { ApplicationChecklistItem } from '../documents/entities/application-checklist-item.entity';
import { DocumentType } from '../documents/entities/document-type.entity';
import { RentalApplication } from '../rental-applications/entities/rental-application.entity';

@Injectable()
export class ApplicationChecklistService {
    constructor(
        @InjectRepository(ApplicationChecklistItem)
        private readonly checklistRepo: Repository<ApplicationChecklistItem>,
        @InjectRepository(DocumentType)
        private readonly documentTypeRepo: Repository<DocumentType>,
        @InjectRepository(RentalApplication)
        private readonly applicationsRepo: Repository<RentalApplication>,
    ) {}

    async seedDefaultChecklist(applicationId: string) {
        const existingCount = await this.checklistRepo.count({ where: { rentalApplicationId: applicationId } });
        if (existingCount > 0) return;

        const requiredTypes = await this.documentTypeRepo.find({
            where: { isRequiredDefault: true },
            order: { label: 'ASC' },
        });

        for (const docType of requiredTypes) {
            await this.checklistRepo.save(
                this.checklistRepo.create({
                    rentalApplicationId: applicationId,
                    documentTypeId: docType.id,
                    status: ChecklistItemStatus.PENDING,
                }),
            );
        }
    }

    async syncApplicationStatusFromChecklist(applicationId: string) {
        const application = await this.applicationsRepo.findOne({ where: { id: applicationId } });
        if (!application) return;

        if (
            application.status !== RentalApplicationStatus.PENDING_DOCUMENTS &&
            application.status !== RentalApplicationStatus.UNDER_REVIEW
        ) {
            return;
        }

        const items = await this.checklistRepo.find({ where: { rentalApplicationId: applicationId } });
        if (items.length === 0) return;

        const allReady = items.every((item) =>
            [ChecklistItemStatus.APPROVED, ChecklistItemStatus.RECEIVED].includes(item.status),
        );

        if (allReady && application.status === RentalApplicationStatus.PENDING_DOCUMENTS) {
            application.status = RentalApplicationStatus.UNDER_REVIEW;
            await this.applicationsRepo.save(application);
        }
    }

    async linkDocumentToChecklistItem(checklistItemId: string, documentId: string, applicationId: string) {
        const item = await this.checklistRepo.findOne({
            where: { id: checklistItemId, rentalApplicationId: applicationId },
        });
        if (!item) throw new NotFoundException('Checklist item not found');

        item.documentId = documentId;
        item.status = ChecklistItemStatus.RECEIVED;
        await this.checklistRepo.save(item);
        await this.syncApplicationStatusFromChecklist(applicationId);
    }
}
