import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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

    @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
    uploadedAt!: Date;

    @ManyToOne(() => User, (user) => user.uploadedDocuments)
    @JoinColumn({ name: 'uploaded_by_user_id' })
    uploadedByUser?: User;

    @OneToMany(() => ApplicationChecklistItem, (applicationChecklistItem) => applicationChecklistItem.document)
    checklistItems?: ApplicationChecklistItem[];
}
