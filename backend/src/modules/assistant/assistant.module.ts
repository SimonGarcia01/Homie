import { Module } from '@nestjs/common';

import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';

import { AssistantContextService } from './assistant-context.service';
import { AssistantSessionService } from './assistant-session.service';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { OpenAiService } from './llm/openai.service';
import { PropertyTools, ToolExecutor } from './tools/property.tools';

@Module({
    imports: [PropertiesModule, UsersModule],
    controllers: [AssistantController],
    providers: [
        AssistantService,
        AssistantContextService,
        AssistantSessionService,
        OpenAiService,
        PropertyTools,
        ToolExecutor,
    ],
})
export class AssistantModule {}
