import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Property } from '../properties/entities/property.entity';
import { PropertyIncome } from '../properties/entities/property-income.entity';
import { PropertyExpense } from '../properties/entities/property-expense.entity';
import { PropertyCommercialStatus } from '../../common/enums';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Property)
        private readonly propertyRepository: Repository<Property>,
        @InjectRepository(PropertyIncome)
        private readonly incomeRepository: Repository<PropertyIncome>,
        @InjectRepository(PropertyExpense)
        private readonly expenseRepository: Repository<PropertyExpense>,
    ) {}

    async getMonthlyIncomesSummary(organizationId: string) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        const prevMonthStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;

        const currentIncomes = await this.incomeRepository
            .createQueryBuilder('income')
            .innerJoin('income.property', 'property')
            .where('property.organization_id = :organizationId', { organizationId })
            .andWhere("TO_CHAR(income.income_date, 'YYYY-MM') = :currentMonthStr", { currentMonthStr })
            .select('SUM(income.amount)', 'total')
            .getRawOne<{ total: string | null }>();

        const previousIncomes = await this.incomeRepository
            .createQueryBuilder('income')
            .innerJoin('income.property', 'property')
            .where('property.organization_id = :organizationId', { organizationId })
            .andWhere("TO_CHAR(income.income_date, 'YYYY-MM') = :prevMonthStr", { prevMonthStr })
            .select('SUM(income.amount)', 'total')
            .getRawOne<{ total: string | null }>();

        return {
            currentMonth: Number(currentIncomes?.total || 0),
            previousMonth: Number(previousIncomes?.total || 0),
            diff: Number(currentIncomes?.total || 0) - Number(previousIncomes?.total || 0),
        };
    }

    async getAvailableProperties(organizationId: string) {
        return this.propertyRepository.find({
            where: {
                organizationId,
                commercialStatus: PropertyCommercialStatus.AVAILABLE,
            },
            relations: ['rentalDetail'],
            select: {
                id: true,
                code: true,
                title: true,
                propertyType: true,
                availableDate: true,
                rentalDetail: {
                    monthlyRent: true,
                    currency: true,
                },
            },
        });
    }

    async getGlobalExpensesReport(organizationId: string, startDate?: string, endDate?: string) {
        const query = this.expenseRepository
            .createQueryBuilder('expense')
            .innerJoin('expense.property', 'property')
            .where('property.organization_id = :organizationId', { organizationId });

        if (startDate) {
            query.andWhere('expense.expense_date >= :startDate', { startDate });
        }
        if (endDate) {
            query.andWhere('expense.expense_date <= :endDate', { endDate });
        }

        const expenses = await query
            .select([
                'property.code as "propertyCode"',
                'property.title as "propertyTitle"',
                'expense.expense_category as "category"',
                'SUM(expense.amount) as "total"',
            ])
            .groupBy('property.id')
            .addGroupBy('expense.expense_category')
            .orderBy('property.title', 'ASC')
            .getRawMany<{ propertyCode: string; propertyTitle: string; category: string; total: string }>();

        return expenses.map((e) => ({
            property: `${e.propertyCode} - ${e.propertyTitle}`,
            category: e.category,
            total: Number(e.total),
        }));
    }
}
