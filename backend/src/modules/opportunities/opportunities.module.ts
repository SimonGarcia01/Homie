import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lead } from '../leads/entities/lead.entity';

import { OpportunityProperty } from './entities/opportunity-property.entity';
import { Opportunity } from './entities/opportunity.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { Pipeline } from './entities/pipeline.entity';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { PipelinesService } from './pipelines.service';

@Module({
    imports: [TypeOrmModule.forFeature([Opportunity, Pipeline, PipelineStage, OpportunityProperty, Lead])],
    controllers: [OpportunitiesController],
    providers: [OpportunitiesService, PipelinesService],
    exports: [OpportunitiesService, PipelinesService],
})
export class OpportunitiesModule {}
