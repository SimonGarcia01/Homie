import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssistantModule } from '../assistant/assistant.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { Lead } from '../leads/entities/lead.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { Property } from '../properties/entities/property.entity';
import { PropertyFeature } from '../properties/entities/property-feature.entity';
import { PropertyLocation } from '../properties/entities/property-location.entity';
import { PropertyRentalDetail } from '../properties/entities/property-rental-detail.entity';
import { Visit } from '../visits/entities/visit.entity';

import { AiUtilsController } from './ai-utils.controller';
import { AiUtilsService } from './ai-utils.service';

@Module({
    imports: [
        AssistantModule,
        ConversationsModule,
        TypeOrmModule.forFeature([Lead, Property, PropertyFeature, PropertyLocation, PropertyRentalDetail, Visit, Opportunity]),
    ],
    controllers: [AiUtilsController],
    providers: [AiUtilsService],
})
export class AiUtilsModule {}
