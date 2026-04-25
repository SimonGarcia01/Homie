import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Activity } from '../modules/activities/entities/activity.entity';
import { Amenity } from '../modules/amenities/entities/amenity.entity';
import { ContactRole } from '../modules/contacts/entities/contact-role.entity';
import { Contact } from '../modules/contacts/entities/contact.entity';
import { ApplicationChecklistItem } from '../modules/documents/entities/application-checklist-item.entity';
import { DocumentType } from '../modules/documents/entities/document-type.entity';
import { DocumentRecord } from '../modules/documents/entities/document.entity';
import { Lead } from '../modules/leads/entities/lead.entity';
import { PreferenceZone } from '../modules/leads/entities/preference-zone.entity';
import { SearchPreference } from '../modules/leads/entities/search-preference.entity';
import { OpportunityProperty } from '../modules/opportunities/entities/opportunity-property.entity';
import { Opportunity } from '../modules/opportunities/entities/opportunity.entity';
import { PipelineStage } from '../modules/opportunities/entities/pipeline-stage.entity';
import { Pipeline } from '../modules/opportunities/entities/pipeline.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { Owner } from '../modules/owners/entities/owner.entity';
import { PropertyAgent } from '../modules/properties/entities/property-agent.entity';
import { PropertyAmenity } from '../modules/properties/entities/property-amenity.entity';
import { PropertyFeature } from '../modules/properties/entities/property-feature.entity';
import { PropertyLocation } from '../modules/properties/entities/property-location.entity';
import { PropertyRentalDetail } from '../modules/properties/entities/property-rental-detail.entity';
import { Property } from '../modules/properties/entities/property.entity';
import { ApplicationApplicant } from '../modules/rental-applications/entities/application-applicant.entity';
import { RentalApplication } from '../modules/rental-applications/entities/rental-application.entity';
import { RentalContract } from '../modules/rental-contracts/entities/rental-contract.entity';
import { RentalEvaluation } from '../modules/rental-evaluations/entities/rental-evaluation.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { TaskItem } from '../modules/tasks/entities/task.entity';
import { User } from '../modules/users/entities/user.entity';
import { Visit } from '../modules/visits/entities/visit.entity';

import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Activity,
            Amenity,
            ApplicationApplicant,
            ApplicationChecklistItem,
            Contact,
            ContactRole,
            DocumentRecord,
            DocumentType,
            Lead,
            Opportunity,
            OpportunityProperty,
            Organization,
            Owner,
            Pipeline,
            PipelineStage,
            PreferenceZone,
            Property,
            PropertyAgent,
            PropertyAmenity,
            PropertyFeature,
            PropertyLocation,
            PropertyRentalDetail,
            RentalApplication,
            RentalContract,
            RentalEvaluation,
            Role,
            SearchPreference,
            TaskItem,
            User,
            Visit,
        ]),
    ],
    controllers: [SeedController],
    providers: [SeedService],
})
export class SeedModule {}
