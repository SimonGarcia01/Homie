import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreatePropertyExpenseDto } from './dto/create-property-expense.dto';
import { CreatePropertyIncomeDto } from './dto/create-property-income.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyBalanceQueryDto } from './dto/property-balance-query.dto';
import { PropertyExpenseReportQueryDto } from './dto/property-expense-report-query.dto';
import { PropertyIncomeSummaryQueryDto } from './dto/property-income-summary-query.dto';
import { PropertySearchQueryDto, PropertyStatsQueryDto } from './dto/property-search-query.dto';
import { PropertyReportPdfQueryDto } from './dto/property-report-pdf-query.dto';
import { UpdatePropertyExpenseDto } from './dto/update-property-expense.dto';
import { UpdatePropertyIncomeDto } from './dto/update-property-income.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

type RequestWithOrg = { user: { id: string; organizationId: string; role: string } };

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
    constructor(private readonly service: PropertiesService) {}

    @Post()
    create(@Body() createDto: CreatePropertyDto, @Req() req: RequestWithOrg) {
        return this.service.create(createDto, req.user.organizationId, req.user.id);
    }

    @Get()
    findAll(@Req() req: RequestWithOrg) {
        return this.service.findAll(req.user.organizationId);
    }

    @Get('search')
    search(@Query() query: PropertySearchQueryDto, @Req() req: RequestWithOrg) {
        return this.service.search(req.user.organizationId, req.user.id, query);
    }

    @Get('stats')
    stats(@Query() query: PropertyStatsQueryDto, @Req() req: RequestWithOrg) {
        return this.service.getStats(req.user.organizationId, req.user.id, query);
    }

    @Get(':id/report/pdf')
    async propertyRecordsPdf(
        @Param('id') id: string,
        @Query() query: PropertyReportPdfQueryDto,
        @Req() req: RequestWithOrg,
    ) {
        const { buffer, filename } = await this.service.buildPropertyRecordsPdfBuffer(
            id,
            req.user.organizationId,
            query,
        );
        return new StreamableFile(buffer, {
            type: 'application/pdf',
            disposition: `attachment; filename="${filename}"`,
        });
    }

    @Get(':id/balance')
    getBalance(@Param('id') id: string, @Query() query: PropertyBalanceQueryDto, @Req() req: RequestWithOrg) {
        return this.service.getBalance(id, req.user.organizationId, query);
    }

    @Get(':id/expenses/report')
    getExpenseReport(
        @Param('id') id: string,
        @Query() query: PropertyExpenseReportQueryDto,
        @Req() req: RequestWithOrg,
    ) {
        return this.service.getExpenseReport(id, req.user.organizationId, query);
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

    @Get(':id/expenses')
    findExpenses(@Param('id') id: string, @Req() req: RequestWithOrg) {
        return this.service.findExpenses(id, req.user.organizationId);
    }

    @Post(':id/expenses')
    createExpense(@Param('id') id: string, @Body() createDto: CreatePropertyExpenseDto, @Req() req: RequestWithOrg) {
        return this.service.createExpense(id, req.user.organizationId, createDto);
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

    @Patch(':id/expenses/:expenseId')
    updateExpense(
        @Param('id') id: string,
        @Param('expenseId') expenseId: string,
        @Body() updateDto: UpdatePropertyExpenseDto,
        @Req() req: RequestWithOrg,
    ) {
        return this.service.updateExpense(id, req.user.organizationId, expenseId, updateDto);
    }

    @Delete(':id/incomes/:incomeId')
    removeIncome(@Param('id') id: string, @Param('incomeId') incomeId: string, @Req() req: RequestWithOrg) {
        return this.service.removeIncome(id, req.user.organizationId, incomeId);
    }

    @Delete(':id/expenses/:expenseId')
    removeExpense(@Param('id') id: string, @Param('expenseId') expenseId: string, @Req() req: RequestWithOrg) {
        return this.service.removeExpense(id, req.user.organizationId, expenseId);
    }

    @Get(':id/summary')
    findSummary(@Param('id') id: string, @Req() req: RequestWithOrg) {
        return this.service.findSummary(id, req.user.organizationId);
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
