import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { VisitStatus, VisitType } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { Activity } from '../../activities/entities/activity.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'visits' })
export class Visit extends TimestampEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'uuid', name: 'opportunity_id' })
  opportunityId!: string;

  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @Column({ type: 'uuid', name: 'contact_id' })
  contactId!: string;

  @Column({ type: 'uuid', name: 'agent_user_id' })
  agentUserId!: string;

  @Column({ type: 'enum', enum: VisitType, name: 'visit_type' })
  visitType!: VisitType;

  @Column({ type: 'enum', enum: VisitStatus, default: VisitStatus.PROPOSED })
  status!: VisitStatus;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.visits)
  @JoinColumn({ name: 'opportunity_id' })
  opportunity?: Opportunity;

  @ManyToOne(() => Property, (property) => property.visits)
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @ManyToOne(() => User, (user) => user.visitsAsAgent)
  @JoinColumn({ name: 'agent_user_id' })
  agentUser?: User;

  @OneToMany(() => Activity, (activity) => activity.visit)
  activities?: Activity[];
}
