import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { Property } from '../../properties/entities/property.entity';

import { ProspectAccount } from './prospect-account.entity';

@Entity({ name: 'prospect_favorites' })
@Unique(['prospectId', 'propertyId'])
export class ProspectFavorite extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'prospect_id' })
    prospectId!: string;

    @Index()
    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @ManyToOne(() => ProspectAccount, (prospect) => prospect.favorites, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'prospect_id' })
    prospect?: ProspectAccount;

    @ManyToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property?: Property;
}
