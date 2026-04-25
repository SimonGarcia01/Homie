import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { SearchPreference } from './search-preference.entity';

@Entity({ name: 'preference_zones' })
export class PreferenceZone {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'search_preference_id' })
    searchPreferenceId!: string;

    @Column({ length: 120 })
    city!: string;

    @Column({ length: 120, nullable: true })
    zone?: string;

    @Column({ length: 120, nullable: true })
    neighborhood?: string;

    @Column({ type: 'smallint', default: 1 })
    priority!: number;

    @ManyToOne(() => SearchPreference, (searchPreference) => searchPreference.preferenceZones)
    @JoinColumn({ name: 'search_preference_id' })
    searchPreference?: SearchPreference;
}
