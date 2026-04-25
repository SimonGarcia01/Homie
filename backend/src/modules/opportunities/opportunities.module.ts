import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PipelineStage } from './entities/pipeline-stage.entity';
import { Pipeline } from './entities/pipeline.entity';
import { OpportunityProperty } from './entities/opportunity-property.entity';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

@Module({
    imports: [TypeOrmModule.forFeature([Opportunity, Pipeline, PipelineStage, OpportunityProperty])],
    controllers: [OpportunitiesController],
    providers: [OpportunitiesService],
    exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
