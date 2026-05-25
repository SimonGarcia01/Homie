import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ReportsService } from './reports.service';

type RequestWithOrg = { user: { organizationId: string } };

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get('incomes/monthly')
    getMonthlyIncomes(@Req() req: RequestWithOrg) {
        return this.reportsService.getMonthlyIncomesSummary(req.user.organizationId);
    }

    @Get('properties/available')
    getAvailableProperties(@Req() req: RequestWithOrg) {
        return this.reportsService.getAvailableProperties(req.user.organizationId);
    }

    @Get('expenses')
    getGlobalExpenses(
        @Req() req: RequestWithOrg,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getGlobalExpensesReport(req.user.organizationId, startDate, endDate);
    }
}
