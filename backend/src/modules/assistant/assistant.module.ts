import { Module } from '@nestjs/common';

import { ConversationsModule } from '../conversations/conversations.module';
import { LeadsModule } from '../leads/leads.module';
import { OwnersModule } from '../owners/owners.module';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';

import { AssistantContextService } from './assistant-context.service';
import { AssistantDraftService } from './assistant-draft.service';
import { AssistantSessionService } from './assistant-session.service';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { OpenAiService } from './llm/openai.service';
import { CrmTools } from './tools/crm.tools';
import { PropertyWriteTools } from './tools/property-write.tools';
import { PropertyTools, ToolExecutor } from './tools/property.tools';

@Module({
    imports: [PropertiesModule, UsersModule, OwnersModule, LeadsModule, ConversationsModule],
    controllers: [AssistantController],
    providers: [
        AssistantService,
        AssistantContextService,
        AssistantDraftService,
        AssistantSessionService,
        OpenAiService,
        PropertyTools,
        PropertyWriteTools,
        CrmTools,
        ToolExecutor,
    ],
    exports: [OpenAiService],
})
export class AssistantModule {}
