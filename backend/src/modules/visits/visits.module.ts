import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivitiesModule } from '../activities/activities.module';
import { Lead } from '../leads/entities/lead.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { OpportunitiesModule } from '../opportunities/opportunities.module';

import { AgentAvailability } from './entities/agent-availability.entity';
import { Visit } from './entities/visit.entity';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Visit, AgentAvailability, Lead, Opportunity]),
        forwardRef(() => ActivitiesModule),
        OpportunitiesModule,
    ],
    controllers: [VisitsController],
    providers: [VisitsService],
    exports: [VisitsService],
})
export class VisitsModule {}
