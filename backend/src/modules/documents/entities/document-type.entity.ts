import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ApplicationChecklistItem } from './application-checklist-item.entity';

@Entity({ name: 'document_types' })
export class DocumentType {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 80, unique: true, name: 'key' })
    key!: string;

    @Column({ length: 180, name: 'label' })
    label!: string;

    @Column({ default: false, name: 'is_required_default' })
    isRequiredDefault!: boolean;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @OneToMany(() => ApplicationChecklistItem, (applicationChecklistItem) => applicationChecklistItem.documentType)
    checklistItems?: ApplicationChecklistItem[];
}
