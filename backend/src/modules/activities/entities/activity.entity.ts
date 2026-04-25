import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ActivityType } from '../../../common/enums';
import { Contact } from '../../contacts/entities/contact.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';
import { Visit } from '../../visits/entities/visit.entity';

@Entity({ name: 'activities' })
export class Activity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'organization_id' })
    organizationId!: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId!: string;

    @Column({ type: 'uuid', name: 'contact_id', nullable: true })
    contactId?: string;

    @Column({ type: 'uuid', name: 'lead_id', nullable: true })
    leadId?: string;

    @Column({ type: 'uuid', name: 'opportunity_id', nullable: true })
    opportunityId?: string;

    @Column({ type: 'uuid', name: 'property_id', nullable: true })
    propertyId?: string;

    @Column({ type: 'uuid', name: 'visit_id', nullable: true })
    visitId?: string;

    @Column({ type: 'enum', enum: ActivityType })
    type!: ActivityType;

    @Column({ type: 'text', nullable: true })
    content?: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @ManyToOne(() => Contact, { nullable: true })
    @JoinColumn({ name: 'contact_id' })
    contact?: Contact;

    @ManyToOne(() => Lead, { nullable: true })
    @JoinColumn({ name: 'lead_id' })
    lead?: Lead;

    @ManyToOne(() => Opportunity, { nullable: true })
    @JoinColumn({ name: 'opportunity_id' })
    opportunity?: Opportunity;

    @ManyToOne(() => Property, { nullable: true })
    @JoinColumn({ name: 'property_id' })
    property?: Property;

    @ManyToOne(() => Visit, { nullable: true })
    @JoinColumn({ name: 'visit_id' })
    visit?: Visit;
}
