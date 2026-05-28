import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateLeadDto, ConvertLeadDto, UpdateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

type RequestWithUser = { user: { organizationId: string; id: string } };

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
    constructor(private readonly service: LeadsService) {}

    @Get()
    findEarlyStage(@Req() req: RequestWithUser, @Query('status') status?: string) {
        return this.service.findEarlyStage(req.user.organizationId, status);
    }

    @Post()
    create(@Req() req: RequestWithUser, @Body() dto: CreateLeadDto) {
        return this.service.create(req.user.organizationId, req.user.id, dto);
    }

    @Patch(':id')
    update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
        return this.service.update(req.user.organizationId, req.user.id, id, dto);
    }

    @Post(':id/convert')
    convert(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: ConvertLeadDto) {
        return this.service.convert(req.user.organizationId, req.user.id, id, dto);
    }

    @Get('counts/new')
    countNew(@Req() req: RequestWithUser) {
        return this.service.countByStatus(req.user.organizationId, 'new');
    }
}
