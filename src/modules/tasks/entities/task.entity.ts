import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TaskPriority, TaskStatus } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'tasks' })
export class TaskItem extends TimestampEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @Column({ type: 'uuid', name: 'assigned_to_user_id' })
  assignedToUserId!: string;

  @Column({ type: 'uuid', name: 'opportunity_id', nullable: true })
  opportunityId?: string;

  @Column({ type: 'uuid', name: 'lead_id', nullable: true })
  leadId?: string;

  @Column({ type: 'uuid', name: 'property_id', nullable: true })
  propertyId?: string;

  @Column({ length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status!: TaskStatus;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User;

  @ManyToOne(() => User, (user) => user.assignedTasks)
  @JoinColumn({ name: 'assigned_to_user_id' })
  assignedToUser?: User;

  @ManyToOne(() => Opportunity, { nullable: true })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity?: Opportunity;

  @ManyToOne(() => Lead, { nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead?: Lead;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'property_id' })
  property?: Property;
}
