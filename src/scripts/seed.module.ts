import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Activity } from '../activities/entities/activity.entity';
import { Amenity } from '../amenities/entities/amenity.entity';
import { ContactRole } from '../contacts/entities/contact-role.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { ApplicationChecklistItem } from '../documents/entities/application-checklist-item.entity';
import { DocumentType } from '../documents/entities/document-type.entity';
import { DocumentRecord } from '../documents/entities/document.entity';
import { Lead } from '../leads/entities/lead.entity';
import { PreferenceZone } from '../leads/entities/preference-zone.entity';
import { SearchPreference } from '../leads/entities/search-preference.entity';
import { OpportunityProperty } from '../opportunities/entities/opportunity-property.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { PipelineStage } from '../opportunities/entities/pipeline-stage.entity';
import { Pipeline } from '../opportunities/entities/pipeline.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Owner } from '../owners/entities/owner.entity';
import { PropertyAgent } from '../properties/entities/property-agent.entity';
import { PropertyAmenity } from '../properties/entities/property-amenity.entity';
import { PropertyFeature } from '../properties/entities/property-feature.entity';
import { PropertyLocation } from '../properties/entities/property-location.entity';
import { PropertyRentalDetail } from '../properties/entities/property-rental-detail.entity';
import { Property } from '../properties/entities/property.entity';
import { ApplicationApplicant } from '../rental-applications/entities/application-applicant.entity';
import { RentalApplication } from '../rental-applications/entities/rental-application.entity';
import { RentalContract } from '../rental-contracts/entities/rental-contract.entity';
import { RentalEvaluation } from '../rental-evaluations/entities/rental-evaluation.entity';
import { Role } from '../roles/entities/role.entity';
import { TaskItem } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Visit } from '../visits/entities/visit.entity';
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
