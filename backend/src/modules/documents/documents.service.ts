import { createReadStream, promises as fs } from 'fs';
import { join } from 'path';

import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChecklistItemStatus } from '../../common/enums';
import type { StorageService } from '../../common/storage/storage.tokens';
import { STORAGE_SERVICE } from '../../common/storage/storage.tokens';
import { RentalApplicationsService } from '../rental-applications/rental-applications.service';

import { DocumentType } from './entities/document-type.entity';
import { DocumentRecord } from './entities/document.entity';

export type DocumentView = {
    id: string;
    name: string;
    kind: string;
    status: string;
    propertyId?: string;
    leadId?: string;
    ownerId?: string;
    uploadedAt: string;
    expiresAt?: string;
    size: string;
    downloadUrl: string;
};

const STATUS_UI: Record<ChecklistItemStatus, string> = {
    [ChecklistItemStatus.PENDING]: 'pendiente',
    [ChecklistItemStatus.RECEIVED]: 'pendiente',
    [ChecklistItemStatus.APPROVED]: 'verificado',
    [ChecklistItemStatus.REJECTED]: 'rechazado',
    [ChecklistItemStatus.EXPIRED]: 'vencido',
};

@Injectable()
export class DocumentsService {
    private readonly uploadsDir: string;

    constructor(
        @InjectRepository(DocumentRecord)
        private readonly repository: Repository<DocumentRecord>,
        @InjectRepository(DocumentType)
        private readonly documentTypeRepo: Repository<DocumentType>,
        @Inject(STORAGE_SERVICE)
        private readonly storage: StorageService,
        configService: ConfigService,
        @Inject(forwardRef(() => RentalApplicationsService))
        private readonly applicationsService: RentalApplicationsService,
    ) {
        this.uploadsDir = configService.get<string>('UPLOADS_DIR', join(process.cwd(), 'uploads'));
    }

    private formatSize(bytes: string) {
        const n = Number(bytes);
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
        return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    }

    private toView(doc: DocumentRecord): DocumentView {
        return {
            id: doc.id,
            name: doc.originalFilename,
            kind: doc.documentKind ?? 'otro',
            status: STATUS_UI[doc.status] ?? 'pendiente',
            propertyId: doc.propertyId ?? undefined,
            leadId: doc.leadId ?? undefined,
            ownerId: doc.ownerId ?? undefined,
            uploadedAt: doc.uploadedAt.toISOString(),
            expiresAt: doc.expiresAt?.toISOString(),
            size: this.formatSize(doc.fileSizeBytes),
            downloadUrl: `/api/documents/${doc.id}/download`,
        };
    }

    async findAll(filters?: { propertyId?: string; leadId?: string }) {
        const where: Record<string, string> = {};
        if (filters?.propertyId) where.propertyId = filters.propertyId;
        if (filters?.leadId) where.leadId = filters.leadId;
        const rows = await this.repository.find({ where, order: { uploadedAt: 'DESC' } });
        return rows.map((d) => this.toView(d));
    }

    async findOne(id: string) {
        const doc = await this.repository.findOne({ where: { id } });
        if (!doc) throw new NotFoundException('Document not found');
        return doc;
    }

    async upload(
        userId: string,
        file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
        meta?: {
            propertyId?: string;
            leadId?: string;
            ownerId?: string;
            kind?: string;
            applicationId?: string;
            checklistItemId?: string;
        },
    ) {
        const stored = await this.storage.store({
            namespace: 'documents',
            buffer: file.buffer,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
        });

        const doc = await this.repository.save(
            this.repository.create({
                uploadedByUserId: userId,
                storageProvider: 'local',
                storageKey: stored.storageKey,
                originalFilename: file.originalname,
                fileSizeBytes: String(file.size),
                documentKind: meta?.kind ?? 'otro',
                propertyId: meta?.propertyId,
                leadId: meta?.leadId,
                ownerId: meta?.ownerId,
                status: ChecklistItemStatus.PENDING,
            }),
        );

        if (meta?.applicationId && meta?.checklistItemId) {
            await this.applicationsService.linkDocumentToChecklistItem(
                meta.checklistItemId,
                doc.id,
                meta.applicationId,
            );
        }

        return this.toView(doc);
    }

    async getDownloadStream(id: string) {
        const doc = await this.findOne(id);
        const fullPath = join(this.uploadsDir, doc.storageKey);
        await fs.access(fullPath);
        return { stream: createReadStream(fullPath), filename: doc.originalFilename, doc };
    }

    async updateStatus(id: string, status: ChecklistItemStatus) {
        const doc = await this.findOne(id);
        doc.status = status;
        await this.repository.save(doc);
        return this.toView(doc);
    }

    async getStats() {
        const rows = await this.repository.find();
        return {
            pendientes: rows.filter((d) => [ChecklistItemStatus.PENDING, ChecklistItemStatus.RECEIVED].includes(d.status)).length,
            sinVerificar: rows.filter((d) => d.status === ChecklistItemStatus.RECEIVED).length,
            rechazados: rows.filter((d) => d.status === ChecklistItemStatus.REJECTED).length,
        };
    }

    listDocumentTypes() {
        return this.documentTypeRepo.find({ order: { label: 'ASC' } });
    }
}
