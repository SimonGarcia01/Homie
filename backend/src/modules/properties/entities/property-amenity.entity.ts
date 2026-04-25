import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Amenity } from '../../amenities/entities/amenity.entity';

import { Property } from './property.entity';

@Entity({ name: 'property_amenities' })
@Unique(['propertyId', 'amenityId'])
export class PropertyAmenity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @Column({ type: 'uuid', name: 'amenity_id' })
    amenityId!: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @ManyToOne(() => Property, (property) => property.amenities)
    @JoinColumn({ name: 'property_id' })
    property?: Property;

    @ManyToOne(() => Amenity, (amenity) => amenity.propertyAmenities)
    @JoinColumn({ name: 'amenity_id' })
    amenity?: Amenity;
}
