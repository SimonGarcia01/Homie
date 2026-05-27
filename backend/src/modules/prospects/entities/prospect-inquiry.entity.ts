import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Property } from '../../properties/entities/property.entity';
import { Lead } from '../../leads/entities/lead.entity';

import { ProspectAccount } from './prospect-account.entity';

export enum ProspectInquiryType {
    VISIT = 'visit',
    QUESTION = 'question',
}

export enum ProspectInquiryStatus {
    RECEIVED = 'received',
    CONTACTED = 'contacted',
    VISIT_SCHEDULED = 'visit_scheduled',
    COMPLETED = 'completed',
    CLOSED = 'closed',
}

@Entity({ name: 'prospect_inquiries' })
export class ProspectInquiry extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'prospect_id' })
    prospectId!: string;

    @Index()
    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @Index()
    @Column({ type: 'uuid', name: 'organization_id' })
    organizationId!: string;

    @Column({ type: 'uuid', name: 'lead_id', nullable: true })
    leadId?: string;

    @Column({ type: 'enum', enum: ProspectInquiryType, default: ProspectInquiryType.VISIT })
    type!: ProspectInquiryType;

    @Column({ type: 'enum', enum: ProspectInquiryStatus, default: ProspectInquiryStatus.RECEIVED })
    status!: ProspectInquiryStatus;

    @Column({ type: 'text', nullable: true })
    message?: string;

    @Column({ length: 50, name: 'preferred_timing', nullable: true })
    preferredTiming?: string;

    @ManyToOne(() => ProspectAccount, (prospect) => prospect.inquiries, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'prospect_id' })
    prospect?: ProspectAccount;

    @ManyToOne(() => Property)
    @JoinColumn({ name: 'property_id' })
    property?: Property;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization;

    @ManyToOne(() => Lead)
    @JoinColumn({ name: 'lead_id' })
    lead?: Lead;
}
