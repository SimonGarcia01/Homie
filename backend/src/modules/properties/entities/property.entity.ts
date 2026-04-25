import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { PropertyCommercialStatus, PropertyPublicationStatus, PropertyType } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { OpportunityProperty } from '../../opportunities/entities/opportunity-property.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Owner } from '../../owners/entities/owner.entity';
import { RentalApplication } from '../../rental-applications/entities/rental-application.entity';
import { RentalContract } from '../../rental-contracts/entities/rental-contract.entity';
import { Visit } from '../../visits/entities/visit.entity';

import { PropertyAgent } from './property-agent.entity';
import { PropertyAmenity } from './property-amenity.entity';
import { PropertyFeature } from './property-feature.entity';
import { PropertyImage } from './property-image.entity';
import { PropertyLocation } from './property-location.entity';
import { PropertyRentalDetail } from './property-rental-detail.entity';

@Entity({ name: 'properties' })
export class Property extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'organization_id' })
    organizationId!: string;

    @Column({ type: 'uuid', name: 'owner_id' })
    ownerId!: string;

    @Column({ length: 50, unique: true })
    code!: string;

    @Column({ length: 180 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: PropertyType, name: 'property_type' })
    propertyType!: PropertyType;

    @Column({
        type: 'enum',
        enum: PropertyCommercialStatus,
        name: 'commercial_status',
        default: PropertyCommercialStatus.AVAILABLE,
    })
    commercialStatus!: PropertyCommercialStatus;

    @Column({
        type: 'enum',
        enum: PropertyPublicationStatus,
        name: 'publication_status',
        default: PropertyPublicationStatus.DRAFT,
    })
    publicationStatus!: PropertyPublicationStatus;

    @Column({ default: true, name: 'is_visible' })
    isVisible!: boolean;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization;

    @ManyToOne(() => Owner, (owner) => owner.properties)
    @JoinColumn({ name: 'owner_id' })
    owner?: Owner;

    @OneToMany(() => PropertyAmenity, (propertyAmenity) => propertyAmenity.property)
    amenities?: PropertyAmenity[];

    @OneToMany(() => PropertyImage, (propertyImage) => propertyImage.property)
    images?: PropertyImage[];

    @OneToMany(() => PropertyAgent, (propertyAgent) => propertyAgent.property)
    assignedAgents?: PropertyAgent[];

    @OneToOne(() => PropertyLocation, (propertyLocation) => propertyLocation.property)
    location?: PropertyLocation;

    @OneToOne(() => PropertyRentalDetail, (propertyRentalDetail) => propertyRentalDetail.property)
    rentalDetail?: PropertyRentalDetail;

    @OneToOne(() => PropertyFeature, (propertyFeature) => propertyFeature.property)
    feature?: PropertyFeature;

    @OneToMany(() => OpportunityProperty, (opportunityProperty) => opportunityProperty.property)
    opportunityLinks?: OpportunityProperty[];

    @OneToMany(() => Visit, (visit) => visit.property)
    visits?: Visit[];

    @OneToMany(() => RentalApplication, (rentalApplication) => rentalApplication.property)
    rentalApplications?: RentalApplication[];

    @OneToMany(() => RentalContract, (rentalContract) => rentalContract.property)
    contracts?: RentalContract[];
}
