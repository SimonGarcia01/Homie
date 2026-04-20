import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RentalApplicationStatus } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { ApplicationChecklistItem } from '../../documents/entities/application-checklist-item.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { Property } from '../../properties/entities/property.entity';
import { RentalContract } from '../../rental-contracts/entities/rental-contract.entity';
import { RentalEvaluation } from '../../rental-evaluations/entities/rental-evaluation.entity';
import { ApplicationApplicant } from './application-applicant.entity';

@Entity({ name: 'rental_applications' })
export class RentalApplication extends TimestampEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'opportunity_id' })
  opportunityId!: string;

  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @Column({
    type: 'enum',
    enum: RentalApplicationStatus,
    default: RentalApplicationStatus.STARTED,
  })
  status!: RentalApplicationStatus;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.rentalApplications)
  @JoinColumn({ name: 'opportunity_id' })
  opportunity?: Opportunity;

  @ManyToOne(() => Property, (property) => property.rentalApplications)
  @JoinColumn({ name: 'property_id' })
  property?: Property;

  @OneToMany(
    () => ApplicationApplicant,
    (applicant) => applicant.rentalApplication,
  )
  applicants?: ApplicationApplicant[];

  @OneToMany(
    () => RentalEvaluation,
    (evaluation) => evaluation.rentalApplication,
  )
  evaluations?: RentalEvaluation[];

  @OneToMany(() => RentalContract, (contract) => contract.rentalApplication)
  contracts?: RentalContract[];

  @OneToMany(
    () => ApplicationChecklistItem,
    (applicationChecklistItem) => applicationChecklistItem.rentalApplication,
  )
  checklistItems?: ApplicationChecklistItem[];
}
