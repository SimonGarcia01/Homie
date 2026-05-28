import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivitiesModule } from '../activities/activities.module';
import { ContactsModule } from '../contacts/contacts.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { OpportunityProperty } from '../opportunities/entities/opportunity-property.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { ProspectInquirySyncModule } from '../prospects/prospect-inquiry-sync.module';

import { Lead } from './entities/lead.entity';
import { SearchPreference } from './entities/search-preference.entity';
import { PreferenceZone } from './entities/preference-zone.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Lead, SearchPreference, PreferenceZone, Opportunity, OpportunityProperty]),
        ContactsModule,
        forwardRef(() => OpportunitiesModule),
        forwardRef(() => ActivitiesModule),
        ProspectInquirySyncModule,
    ],
    controllers: [LeadsController],
    providers: [LeadsService],
    exports: [LeadsService],
})
export class LeadsModule {}
