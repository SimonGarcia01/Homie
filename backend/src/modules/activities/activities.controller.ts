import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ActivitiesService } from './activities.service';

type RequestWithOrg = { user: { organizationId: string } };

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
    constructor(private readonly service: ActivitiesService) {}

    @Get()
    findRecent(@Req() req: RequestWithOrg, @Query('limit') limit?: string) {
        return this.service.findRecent(req.user.organizationId, limit ? Number(limit) : 8);
    }
}
