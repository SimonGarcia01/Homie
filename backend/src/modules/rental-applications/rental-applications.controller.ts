import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RentalApplicationsService } from './rental-applications.service';

@ApiTags('rental-applications')
@ApiBearerAuth()
@Controller('applications')
export class RentalApplicationsController {
    constructor(private readonly service: RentalApplicationsService) {}

    @Get()
    findAll(@Query('status') status?: string) {
        if (status === 'pending_documents') {
            return this.service.findPending();
        }
        return this.service.findPending();
    }

    @Get('counts/pending')
    countPending() {
        return this.service.countPending();
    }

    @Post()
    create(@Body() dto: { opportunityId: string; propertyId: string }) {
        return this.service.create(dto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }
}
