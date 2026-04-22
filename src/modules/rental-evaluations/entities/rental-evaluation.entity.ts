import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EvaluationRecommendation } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { RentalApplication } from '../../rental-applications/entities/rental-application.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'rental_evaluations' })
export class RentalEvaluation extends TimestampEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'rental_application_id' })
  rentalApplicationId!: string;

  @Column({ type: 'uuid', name: 'evaluated_by_user_id' })
  evaluatedByUserId!: string;

  @Column({ type: 'enum', enum: EvaluationRecommendation })
  recommendation!: EvaluationRecommendation;

  @ManyToOne(
    () => RentalApplication,
    (rentalApplication) => rentalApplication.evaluations,
  )
  @JoinColumn({ name: 'rental_application_id' })
  rentalApplication?: RentalApplication;

  @ManyToOne(() => User, (user) => user.evaluations)
  @JoinColumn({ name: 'evaluated_by_user_id' })
  evaluatedByUser?: User;
}
