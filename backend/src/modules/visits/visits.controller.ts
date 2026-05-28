import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateVisitDto } from './dto/create-visit.dto';
import { ScheduleVisitDto } from './dto/schedule-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { VisitsService } from './visits.service';

type RequestWithUser = { user: { organizationId: string; id: string } };

@ApiTags('visits')
@ApiBearerAuth()
@Controller('visits')
export class VisitsController {
    constructor(private readonly service: VisitsService) {}

    @Get()
    findAll(@Req() req: RequestWithUser, @Query('from') from?: string, @Query('to') to?: string) {
        return this.service.findAll(req.user.organizationId, from, to);
    }

    @Get('upcoming')
    upcoming(@Req() req: RequestWithUser, @Query('limit') limit?: string) {
        return this.service.findUpcoming(req.user.organizationId, limit ? Number(limit) : 10);
    }

    @Post()
    create(@Req() req: RequestWithUser, @Body() dto: CreateVisitDto) {
        return this.service.create(req.user.organizationId, req.user.id, dto);
    }

    @Post('schedule')
    schedule(@Req() req: RequestWithUser, @Body() dto: ScheduleVisitDto) {
        return this.service.scheduleFromLead(req.user.organizationId, req.user.id, dto);
    }

    @Patch(':id')
    update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: UpdateVisitDto) {
        return this.service.update(req.user.organizationId, id, dto);
    }
}
