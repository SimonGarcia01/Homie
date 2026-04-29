import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { LocationPrecision } from '../../../common/enums';

import { Property } from './property.entity';

@Entity({ name: 'property_locations' })
export class PropertyLocation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'property_id', unique: true })
    propertyId!: string;

    @Column({ length: 80 })
    country!: string;

    @Column({ length: 120 })
    city!: string;

    @Column({ length: 255, nullable: true })
    address?: string | null;

    @Column({
        type: 'enum',
        enum: LocationPrecision,
        name: 'location_precision',
        default: LocationPrecision.EXACT,
    })
    locationPrecision!: LocationPrecision;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @OneToOne(() => Property, (property) => property.location)
    @JoinColumn({ name: 'property_id' })
    property?: Property;
}
