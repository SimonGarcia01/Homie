import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivitiesModule } from '../activities/activities.module';
import { Lead } from '../leads/entities/lead.entity';
import { LeadsModule } from '../leads/leads.module';

import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationMessage } from './entities/conversation-message.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ConversationMessage, Lead]), LeadsModule, ActivitiesModule],
    controllers: [ConversationsController],
    providers: [ConversationsService],
    exports: [ConversationsService],
})
export class ConversationsModule {}
