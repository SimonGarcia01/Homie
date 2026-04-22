import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApplicantRole } from '../../../common/enums';
import { Contact } from '../../contacts/entities/contact.entity';
import { RentalApplication } from './rental-application.entity';

@Entity({ name: 'application_applicants' })
export class ApplicationApplicant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'rental_application_id' })
  rentalApplicationId!: string;

  @Column({ type: 'uuid', name: 'contact_id' })
  contactId!: string;

  @Column({ type: 'enum', enum: ApplicantRole, name: 'applicant_role' })
  applicantRole!: ApplicantRole;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(
    () => RentalApplication,
    (rentalApplication) => rentalApplication.applicants,
  )
  @JoinColumn({ name: 'rental_application_id' })
  rentalApplication?: RentalApplication;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;
}
