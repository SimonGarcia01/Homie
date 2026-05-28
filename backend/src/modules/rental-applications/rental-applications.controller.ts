import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RentalApplicationStatus } from '../../common/enums';
import { CreateRentalContractDto } from '../rental-contracts/dto/create-rental-contract.dto';
import { UpdateRentalContractDto } from '../rental-contracts/dto/update-rental-contract.dto';
import { CreateRentalEvaluationDto } from '../rental-evaluations/dto/create-rental-evaluation.dto';

import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateRentalApplicationDto } from './dto/update-rental-application.dto';
import { RentalApplicationsService } from './rental-applications.service';

type RequestWithUser = { user: { id: string; organizationId: string } };

@ApiTags('rental-applications')
@ApiBearerAuth()
@Controller('applications')
export class RentalApplicationsController {
    constructor(private readonly service: RentalApplicationsService) {}

    @Get()
    findAll(@Query('status') status?: RentalApplicationStatus) {
        return this.service.findAll(status);
    }

    @Get('counts/pending')
    countPending() {
        return this.service.countPending();
    }

    @Post()
    create(@Body() dto: { opportunityId: string; propertyId: string }) {
        return this.service.create(dto);
    }

    @Get(':id/evaluation')
    getEvaluation(@Param('id') id: string) {
        return this.service.getEvaluation(id);
    }

    @Post(':id/evaluation')
    createEvaluation(@Param('id') id: string, @Req() req: RequestWithUser, @Body() dto: CreateRentalEvaluationDto) {
        return this.service.createEvaluation(id, req.user.id, dto);
    }

    @Post(':id/contract')
    createContract(@Param('id') id: string, @Body() dto: CreateRentalContractDto) {
        return this.service.createContract(id, dto);
    }

    @Patch(':id/contract')
    updateContract(@Param('id') id: string, @Body() dto: UpdateRentalContractDto) {
        return this.service.updateContract(id, dto);
    }

    @Patch(':id/checklist/:itemId')
    updateChecklistItem(
        @Param('id') id: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateChecklistItemDto,
    ) {
        return this.service.updateChecklistItem(id, itemId, dto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateRentalApplicationDto) {
        return this.service.update(id, dto);
    }
}
