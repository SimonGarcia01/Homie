import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { OpportunityPropertyStatus } from '../../../common/enums';
import { Property } from '../../properties/entities/property.entity';

import { Opportunity } from './opportunity.entity';

@Entity({ name: 'opportunity_properties' })
@Unique(['opportunityId', 'propertyId'])
export class OpportunityProperty {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'opportunity_id' })
    opportunityId!: string;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @Column({
        type: 'enum',
        enum: OpportunityPropertyStatus,
        default: OpportunityPropertyStatus.SUGGESTED,
    })
    status!: OpportunityPropertyStatus;

    @ManyToOne(() => Opportunity, (opportunity) => opportunity.candidateProperties)
    @JoinColumn({ name: 'opportunity_id' })
    opportunity?: Opportunity;

    @ManyToOne(() => Property, (property) => property.opportunityLinks)
    @JoinColumn({ name: 'property_id' })
    property?: Property;
}
