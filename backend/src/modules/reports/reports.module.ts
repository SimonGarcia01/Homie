import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Property } from '../properties/entities/property.entity';
import { PropertyIncome } from '../properties/entities/property-income.entity';
import { PropertyExpense } from '../properties/entities/property-expense.entity';

import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Property, PropertyIncome, PropertyExpense])],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule {}
