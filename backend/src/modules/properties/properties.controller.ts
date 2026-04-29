import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreatePropertyIncomeDto } from './dto/create-property-income.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyIncomeSummaryQueryDto } from './dto/property-income-summary-query.dto';
import { UpdatePropertyIncomeDto } from './dto/update-property-income.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

type RequestWithOrg = { user: { organizationId: string } };

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
    constructor(private readonly service: PropertiesService) {}

    @Post()
    create(@Body() createDto: CreatePropertyDto, @Req() req: RequestWithOrg) {
        return this.service.create(createDto, req.user.organizationId);
    }

    @Get()
    findAll(@Req() req: RequestWithOrg) {
        return this.service.findAll(req.user.organizationId);
    }

    @Get(':id/report/pdf')
    async propertyRecordsPdf(@Param('id') id: string, @Req() req: RequestWithOrg) {
        const { buffer, filename } = await this.service.buildPropertyRecordsPdfBuffer(id, req.user.organizationId);
        return new StreamableFile(buffer, {
            type: 'application/pdf',
            disposition: `attachment; filename="${filename}"`,
        });
    }

    @Get(':id/incomes/summary')
    getIncomeSummary(
        @Param('id') id: string,
        @Query() query: PropertyIncomeSummaryQueryDto,
        @Req() req: RequestWithOrg,
    ) {
        return this.service.getIncomeSummary(id, req.user.organizationId, query);
    }

    @Get(':id/incomes')
    findIncomes(@Param('id') id: string, @Req() req: RequestWithOrg) {
        return this.service.findIncomes(id, req.user.organizationId);
    }

    @Post(':id/incomes')
    createIncome(@Param('id') id: string, @Body() createDto: CreatePropertyIncomeDto, @Req() req: RequestWithOrg) {
        return this.service.createIncome(id, req.user.organizationId, createDto);
    }

    @Patch(':id/incomes/:incomeId')
    updateIncome(
        @Param('id') id: string,
        @Param('incomeId') incomeId: string,
        @Body() updateDto: UpdatePropertyIncomeDto,
        @Req() req: RequestWithOrg,
    ) {
        return this.service.updateIncome(id, req.user.organizationId, incomeId, updateDto);
    }

    @Delete(':id/incomes/:incomeId')
    removeIncome(@Param('id') id: string, @Param('incomeId') incomeId: string, @Req() req: RequestWithOrg) {
        return this.service.removeIncome(id, req.user.organizationId, incomeId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: RequestWithOrg) {
        return this.service.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdatePropertyDto, @Req() req: RequestWithOrg) {
        return this.service.update(id, req.user.organizationId, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: RequestWithOrg) {
        return this.service.remove(id, req.user.organizationId);
    }
}
