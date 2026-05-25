import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AssistantService } from './assistant.service';
import { ChatRequestDto } from './dto/chat.dto';

type RequestWithUser = {
    user: { id: string; email: string; organizationId: string; role: string };
};

@ApiTags('assistant')
@ApiBearerAuth()
@Controller('assistant')
export class AssistantController {
    constructor(private readonly service: AssistantService) {}

    @Post('chat')
    chat(@Body() dto: ChatRequestDto, @Req() req: RequestWithUser) {
        return this.service.chat(dto, req.user);
    }
}
