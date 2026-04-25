import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ChecklistItemStatus } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { RentalApplication } from '../../rental-applications/entities/rental-application.entity';

import { DocumentRecord } from './document.entity';
import { DocumentType } from './document-type.entity';

@Entity({ name: 'application_checklist_items' })
export class ApplicationChecklistItem extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'rental_application_id' })
    rentalApplicationId!: string;

    @Column({ type: 'uuid', name: 'document_type_id' })
    documentTypeId!: string;

    @Column({ type: 'uuid', nullable: true, name: 'document_id' })
    documentId?: string;

    @Column({
        type: 'enum',
        enum: ChecklistItemStatus,
        default: ChecklistItemStatus.PENDING,
    })
    status!: ChecklistItemStatus;

    @ManyToOne(() => RentalApplication)
    @JoinColumn({ name: 'rental_application_id' })
    rentalApplication?: RentalApplication;

    @ManyToOne(() => DocumentType, (documentType) => documentType.checklistItems)
    @JoinColumn({ name: 'document_type_id' })
    documentType?: DocumentType;

    @ManyToOne(() => DocumentRecord, (documentRecord) => documentRecord.checklistItems, {
        nullable: true,
    })
    @JoinColumn({ name: 'document_id' })
    document?: DocumentRecord;
}
