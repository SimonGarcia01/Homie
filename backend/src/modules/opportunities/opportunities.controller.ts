import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { LinkOpportunityPropertyDto } from './dto/link-opportunity-property.dto';
import { UpdateOpportunityStageDto } from './dto/update-opportunity-stage.dto';
import { OpportunitiesService } from './opportunities.service';
import { PipelinesService } from './pipelines.service';

type RequestWithUser = { user: { organizationId: string; id: string } };

@ApiTags('opportunities')
@ApiBearerAuth()
@Controller('opportunities')
export class OpportunitiesController {
    constructor(
        private readonly service: OpportunitiesService,
        private readonly pipelinesService: PipelinesService,
    ) {}

    @Get()
    findAll(@Req() req: RequestWithUser) {
        return this.service.findAll(req.user.organizationId);
    }

    @Get('board')
    board(@Req() req: RequestWithUser) {
        return this.service.getBoard(req.user.organizationId);
    }

    @Get('pipeline/default')
    defaultPipeline(@Req() req: RequestWithUser) {
        return this.pipelinesService.ensureDefaultPipeline(req.user.organizationId);
    }

    @Post()
    create(@Req() req: RequestWithUser, @Body() dto: CreateOpportunityDto) {
        return this.service.create(req.user.organizationId, req.user.id, dto);
    }

    @Patch(':id/stage')
    updateStage(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: UpdateOpportunityStageDto) {
        return this.service.updateStage(req.user.organizationId, id, dto);
    }

    @Post(':id/properties')
    linkProperty(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: LinkOpportunityPropertyDto) {
        return this.service.linkProperty(req.user.organizationId, id, dto);
    }
}
