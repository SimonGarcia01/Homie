import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { DocumentRecord } from '../../documents/entities/document.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { PropertyAgent } from '../../properties/entities/property-agent.entity';
import { RentalEvaluation } from '../../rental-evaluations/entities/rental-evaluation.entity';
import { Role } from '../../roles/entities/role.entity';
import { TaskItem } from '../../tasks/entities/task.entity';
import { AgentAvailability } from '../../visits/entities/agent-availability.entity';
import { Visit } from '../../visits/entities/visit.entity';

@Entity({ name: 'users' })
export class User extends TimestampEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @Index()
  @Column({ length: 180, unique: true })
  email!: string;

  @Column({ length: 255, name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ length: 100, name: 'last_name' })
  lastName!: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @ManyToOne(() => Organization, (organization) => organization.users)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @OneToMany(() => Lead, (lead) => lead.ownerUser)
  ownedLeads?: Lead[];

  @OneToMany(() => Opportunity, (opportunity) => opportunity.ownerUser)
  ownedOpportunities?: Opportunity[];

  @OneToMany(() => TaskItem, (task) => task.createdByUser)
  createdTasks?: TaskItem[];

  @OneToMany(() => TaskItem, (task) => task.assignedToUser)
  assignedTasks?: TaskItem[];

  @OneToMany(() => Visit, (visit) => visit.agentUser)
  visitsAsAgent?: Visit[];

  @OneToMany(
    () => AgentAvailability,
    (agentAvailability) => agentAvailability.user,
  )
  availabilities?: AgentAvailability[];

  @OneToMany(() => PropertyAgent, (propertyAgent) => propertyAgent.user)
  propertyAssignments?: PropertyAgent[];

  @OneToMany(
    () => DocumentRecord,
    (documentRecord) => documentRecord.uploadedByUser,
  )
  uploadedDocuments?: DocumentRecord[];

  @OneToMany(
    () => RentalEvaluation,
    (rentalEvaluation) => rentalEvaluation.evaluatedByUser,
  )
  evaluations?: RentalEvaluation[];
}
