import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../../common/entities/timestamp.entity';

import { Property } from './property.entity';

@Entity({ name: 'property_rental_details' })
export class PropertyRentalDetail extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'property_id', unique: true })
    propertyId!: string;

    @Column({ type: 'numeric', precision: 14, scale: 2, name: 'monthly_rent' })
    monthlyRent!: string;

    @Column({ length: 10, default: 'COP' })
    currency!: string;

    @OneToOne(() => Property, (property) => property.rentalDetail)
    @JoinColumn({ name: 'property_id' })
    property?: Property;
}
