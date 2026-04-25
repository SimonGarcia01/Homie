import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { PropertyType } from '../../../common/enums';

import { PreferenceZone } from './preference-zone.entity';
import { Lead } from './lead.entity';

@Entity({ name: 'search_preferences' })
export class SearchPreference {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'lead_id' })
    leadId!: string;

    @Column({
        type: 'enum',
        enum: PropertyType,
        nullable: true,
        name: 'property_type',
    })
    propertyType?: PropertyType;

    @Column({
        type: 'numeric',
        precision: 14,
        scale: 2,
        nullable: true,
        name: 'rent_min',
    })
    rentMin?: string;

    @Column({
        type: 'numeric',
        precision: 14,
        scale: 2,
        nullable: true,
        name: 'rent_max',
    })
    rentMax?: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @ManyToOne(() => Lead, (lead) => lead.searchPreferences)
    @JoinColumn({ name: 'lead_id' })
    lead?: Lead;

    @OneToMany(() => PreferenceZone, (preferenceZone) => preferenceZone.searchPreference)
    preferenceZones?: PreferenceZone[];
}
