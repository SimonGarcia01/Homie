import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { RentalContractStatus } from '../../../common/enums';
import { Contact } from '../../contacts/entities/contact.entity';
import { Property } from '../../properties/entities/property.entity';
import { RentalApplication } from '../../rental-applications/entities/rental-application.entity';

@Entity({ name: 'rental_contracts' })
export class RentalContract {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'rental_application_id' })
    rentalApplicationId!: string;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @Column({ type: 'uuid', name: 'tenant_contact_id' })
    tenantContactId!: string;

    @Column({
        type: 'enum',
        enum: RentalContractStatus,
        default: RentalContractStatus.DRAFT,
    })
    status!: RentalContractStatus;

    @Column({ type: 'date', name: 'start_date' })
    startDate!: string;

    @Column({ type: 'date', name: 'end_date' })
    endDate!: string;

    @Column({ type: 'numeric', precision: 14, scale: 2, name: 'monthly_rent' })
    monthlyRent!: string;

    @Column({ type: 'timestamptz', name: 'signed_at', nullable: true })
    signedAt?: Date;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @ManyToOne(() => RentalApplication, (rentalApplication) => rentalApplication.contracts)
    @JoinColumn({ name: 'rental_application_id' })
    rentalApplication?: RentalApplication;

    @ManyToOne(() => Property, (property) => property.contracts)
    @JoinColumn({ name: 'property_id' })
    property?: Property;

    @ManyToOne(() => Contact)
    @JoinColumn({ name: 'tenant_contact_id' })
    tenantContact?: Contact;
}
