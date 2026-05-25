import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ChecklistItemStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

import { ApplicationChecklistItem } from './application-checklist-item.entity';

@Entity({ name: 'documents' })
export class DocumentRecord {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'uploaded_by_user_id' })
    uploadedByUserId!: string;

    @Column({ length: 100, name: 'storage_provider' })
    storageProvider!: string;

    @Column({ type: 'text', name: 'storage_key' })
    storageKey!: string;

    @Column({ type: 'text', name: 'original_filename' })
    originalFilename!: string;

    @Column({ type: 'bigint', name: 'file_size_bytes' })
    fileSizeBytes!: string;

    @Column({ type: 'varchar', length: 50, name: 'document_kind', nullable: true })
    documentKind?: string | null;

    @Column({
        type: 'enum',
        enum: ChecklistItemStatus,
        default: ChecklistItemStatus.PENDING,
    })
    status!: ChecklistItemStatus;

    @Column({ type: 'uuid', name: 'property_id', nullable: true })
    propertyId?: string | null;

    @Column({ type: 'uuid', name: 'lead_id', nullable: true })
    leadId?: string | null;

    @Column({ type: 'uuid', name: 'owner_id', nullable: true })
    ownerId?: string | null;

    @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
    expiresAt?: Date | null;

    @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
    uploadedAt!: Date;

    @ManyToOne(() => User, (user) => user.uploadedDocuments)
    @JoinColumn({ name: 'uploaded_by_user_id' })
    uploadedByUser?: User;

    @OneToMany(() => ApplicationChecklistItem, (applicationChecklistItem) => applicationChecklistItem.document)
    checklistItems?: ApplicationChecklistItem[];
}
