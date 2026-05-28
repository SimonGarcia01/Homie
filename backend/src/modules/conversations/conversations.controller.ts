import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateConversationMessageDto } from './dto/create-conversation-message.dto';
import { ConversationsService } from './conversations.service';

type RequestWithUser = { user: { id: string; organizationId: string } };

@ApiTags('inbox')
@ApiBearerAuth()
@Controller()
export class ConversationsController {
    constructor(private readonly service: ConversationsService) {}

    @Get('inbox/threads')
    listThreads(@Req() req: RequestWithUser, @Query('limit') limit?: string) {
        return this.service.listThreads(req.user.organizationId, limit ? Number(limit) : 30);
    }

    @Get('leads/:leadId/messages')
    listMessages(
        @Req() req: RequestWithUser,
        @Param('leadId', new ParseUUIDPipe()) leadId: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.listForLead(req.user.organizationId, leadId, limit ? Number(limit) : 100);
    }

    @Post('leads/:leadId/messages')
    createMessage(
        @Req() req: RequestWithUser,
        @Param('leadId', new ParseUUIDPipe()) leadId: string,
        @Body() dto: CreateConversationMessageDto,
    ) {
        return this.service.create(req.user.organizationId, req.user.id, leadId, dto);
    }
}
