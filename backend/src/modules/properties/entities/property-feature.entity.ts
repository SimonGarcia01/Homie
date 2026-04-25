import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Property } from './property.entity';

@Entity({ name: 'property_features' })
export class PropertyFeature {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'property_id', unique: true })
    propertyId!: string;

    @Column({ default: 0 })
    bedrooms!: number;

    @Column({ default: 0 })
    bathrooms!: number;

    @Column({ default: false, name: 'is_furnished' })
    isFurnished!: boolean;

    @Column({ default: false, name: 'pets_allowed' })
    petsAllowed!: boolean;

    @OneToOne(() => Property, (property) => property.feature)
    @JoinColumn({ name: 'property_id' })
    property?: Property;
}
