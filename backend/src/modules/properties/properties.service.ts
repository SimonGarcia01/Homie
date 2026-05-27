import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { commercialStatusToEs, propertyTypeToEs, toPropertySummaryEs } from '../../common/domain-labels';
import { ActivityType, PropertyCommercialStatus, PropertyExpenseCategory, PropertyPublicationStatus, PropertyType } from '../../common/enums';

import { ActivitiesService } from '../activities/activities.service';

import { CreatePropertyExpenseDto } from './dto/create-property-expense.dto';
import { CreatePropertyIncomeDto } from './dto/create-property-income.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertySearchQueryDto, PropertyStatsQueryDto } from './dto/property-search-query.dto';
import { PublicPropertyFilterDto } from './dto/public-property-filter.dto';
import { PropertyBalanceQueryDto } from './dto/property-balance-query.dto';
import { PropertyExpenseReportQueryDto } from './dto/property-expense-report-query.dto';
import { PropertyIncomeSummaryQueryDto } from './dto/property-income-summary-query.dto';
import { PropertyReportPdfQueryDto } from './dto/property-report-pdf-query.dto';
import { UpdatePropertyExpenseDto } from './dto/update-property-expense.dto';
import { UpdatePropertyIncomeDto } from './dto/update-property-income.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyExpense } from './entities/property-expense.entity';
import { PropertyFeature } from './entities/property-feature.entity';
import { PropertyIncome } from './entities/property-income.entity';
import { PropertyLocation } from './entities/property-location.entity';
import { PropertyRentalDetail } from './entities/property-rental-detail.entity';
import { Property } from './entities/property.entity';

type DateRangeFilter = { startDate?: string; endDate?: string };

const EXPENSE_CATEGORY_LABEL: Record<PropertyExpenseCategory, string> = {
    [PropertyExpenseCategory.MANTENIMIENTO]: 'Mantenimiento',
    [PropertyExpenseCategory.IMPUESTO]: 'Impuesto',
    [PropertyExpenseCategory.SERVICIO]: 'Servicio',
};

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private readonly repository: Repository<Property>,
        @InjectRepository(PropertyIncome)
        private readonly incomeRepository: Repository<PropertyIncome>,
        @InjectRepository(PropertyExpense)
        private readonly expenseRepository: Repository<PropertyExpense>,
        private readonly dataSource: DataSource,
        private readonly activitiesService: ActivitiesService,
    ) {}

    async create(createDto: CreatePropertyDto, organizationId: string, userId: string) {
        const property = await this.dataSource.transaction(async (manager) => {
            const property = manager.create(Property, {
                organizationId,
                ownerId: createDto.ownerId,
                code: createDto.code.trim(),
                title: createDto.title.trim(),
                description: createDto.description?.trim(),
                propertyType: createDto.propertyType,
                commercialStatus: createDto.commercialStatus ?? PropertyCommercialStatus.AVAILABLE,
                publicationStatus: createDto.publicationStatus ?? PropertyPublicationStatus.DRAFT,
                isVisible: createDto.isVisible ?? true,
            });
            const savedProperty = await manager.save(property);

            const rentalDetail = manager.create(PropertyRentalDetail, {
                propertyId: savedProperty.id,
                monthlyRent: createDto.monthlyRent.toFixed(2),
                currency: createDto.currency?.trim() || 'COP',
            });
            await manager.save(rentalDetail);

            const location = manager.create(PropertyLocation, {
                propertyId: savedProperty.id,
                country: createDto.country?.trim() || 'Colombia',
                city: createDto.city.trim(),
                address: createDto.address?.trim(),
            });
            await manager.save(location);

            const feature = manager.create(PropertyFeature, {
                propertyId: savedProperty.id,
                bedrooms: createDto.bedrooms ?? 0,
                bathrooms: createDto.bathrooms ?? 0,
            });
            await manager.save(feature);

            return manager.findOneOrFail(Property, {
                where: { id: savedProperty.id },
                relations: { rentalDetail: true, location: true, images: true, feature: true },
            });
        });

        await this.activitiesService.create(organizationId, userId, {
            type: ActivityType.PROPERTY,
            content: 'Propiedad creada',
            propertyId: property.id,
        });

        return property;
    }

    async findAll(organizationId: string) {
        const properties = await this.repository.find({
            where: { organizationId },
            relations: { images: true, rentalDetail: true, location: true, feature: true },
            order: { updatedAt: 'DESC' },
        });
        return properties.map((property) => this.attachCover(property));
    }

    async findOne(id: string, organizationId: string) {
        const entity = await this.repository.findOne({
            where: { id, organizationId },
            relations: { images: true, rentalDetail: true, location: true, feature: true },
        });
        if (!entity) throw new NotFoundException('Property not found');
        return this.attachCover(entity);
    }

    async update(id: string, organizationId: string, updateDto: UpdatePropertyDto) {
        const entity = await this.findOne(id, organizationId);
        if (updateDto.ownerId !== undefined) entity.ownerId = updateDto.ownerId;
        if (updateDto.code !== undefined) entity.code = updateDto.code.trim();
        if (updateDto.title !== undefined) entity.title = updateDto.title.trim();
        if (updateDto.description !== undefined) entity.description = updateDto.description?.trim();
        if (updateDto.propertyType !== undefined) entity.propertyType = updateDto.propertyType;
        if (updateDto.commercialStatus !== undefined) entity.commercialStatus = updateDto.commercialStatus;
        if (updateDto.publicationStatus !== undefined) entity.publicationStatus = updateDto.publicationStatus;
        if (updateDto.isVisible !== undefined) entity.isVisible = updateDto.isVisible;

        await this.repository.save(entity);

        if (updateDto.bedrooms !== undefined || updateDto.bathrooms !== undefined) {
            let feature = entity.feature;
            if (!feature) {
                feature = this.dataSource.manager.create(PropertyFeature, { propertyId: entity.id, bedrooms: 0, bathrooms: 0 });
            }
            if (updateDto.bedrooms !== undefined) feature.bedrooms = updateDto.bedrooms;
            if (updateDto.bathrooms !== undefined) feature.bathrooms = updateDto.bathrooms;
            await this.dataSource.manager.save(feature);
        }

        if (
            updateDto.monthlyRent !== undefined ||
            updateDto.currency !== undefined
        ) {
            const rental = entity.rentalDetail;
            if (rental) {
                if (updateDto.monthlyRent !== undefined) rental.monthlyRent = updateDto.monthlyRent.toFixed(2);
                if (updateDto.currency !== undefined) rental.currency = updateDto.currency.trim();
                await this.dataSource.manager.save(rental);
            }
        }

        if (updateDto.city !== undefined || updateDto.country !== undefined || updateDto.address !== undefined) {
            const location = entity.location;
            if (location) {
                if (updateDto.city !== undefined) location.city = updateDto.city.trim();
                if (updateDto.country !== undefined) location.country = updateDto.country.trim();
                if (updateDto.address !== undefined) location.address = updateDto.address?.trim();
                await this.dataSource.manager.save(location);
            }
        }

        return this.findOne(id, organizationId);
    }

    async remove(id: string, organizationId: string) {
        const entity = await this.findOne(id, organizationId);
        await this.repository.remove(entity);
        return { id };
    }

    async createIncome(propertyId: string, organizationId: string, createDto: CreatePropertyIncomeDto) {
        await this.findOne(propertyId, organizationId);

        const income = this.incomeRepository.create({
            propertyId,
            amount: createDto.amount.toFixed(2),
            incomeDate: createDto.incomeDate,
            incomeType: createDto.incomeType,
            description: createDto.description.trim(),
        });

        const savedIncome = await this.incomeRepository.save(income);
        return this.mapIncome(savedIncome);
    }

    async findIncomes(propertyId: string, organizationId: string) {
        await this.findOne(propertyId, organizationId);
        const incomes = await this.incomeRepository.find({
            where: { propertyId },
            order: { incomeDate: 'ASC', createdAt: 'ASC' },
        });

        return incomes.map((income) => this.mapIncome(income));
    }

    async getIncomeSummary(propertyId: string, organizationId: string, query: PropertyIncomeSummaryQueryDto) {
        await this.findOne(propertyId, organizationId);

        const qb = this.incomeRepository
            .createQueryBuilder('income')
            .where('income.property_id = :propertyId', { propertyId });
        this.applyIncomeDateRange(qb, query);

        const raw = await qb
            .select('COALESCE(SUM(income.amount), 0)', 'total')
            .addSelect('COUNT(*)', 'count')
            .getRawOne<{ total: string; count: string }>();

        return {
            propertyId,
            startDate: query.startDate ?? null,
            endDate: query.endDate ?? null,
            total: Number(raw?.total ?? '0'),
            entries: Number(raw?.count ?? '0'),
        };
    }

    async updateIncome(
        propertyId: string,
        organizationId: string,
        incomeId: string,
        updateDto: UpdatePropertyIncomeDto,
    ) {
        await this.findOne(propertyId, organizationId);
        const income = await this.incomeRepository.findOne({ where: { id: incomeId, propertyId } });
        if (!income) throw new NotFoundException('Property income not found');

        if (updateDto.amount !== undefined) income.amount = updateDto.amount.toFixed(2);
        if (updateDto.incomeDate !== undefined) income.incomeDate = updateDto.incomeDate;
        if (updateDto.incomeType !== undefined) income.incomeType = updateDto.incomeType;
        if (updateDto.description !== undefined) income.description = updateDto.description.trim();

        const updated = await this.incomeRepository.save(income);
        return this.mapIncome(updated);
    }

    async removeIncome(propertyId: string, organizationId: string, incomeId: string) {
        await this.findOne(propertyId, organizationId);
        const income = await this.incomeRepository.findOne({ where: { id: incomeId, propertyId } });
        if (!income) throw new NotFoundException('Property income not found');

        await this.incomeRepository.remove(income);
        return { id: incomeId };
    }

    async createExpense(propertyId: string, organizationId: string, createDto: CreatePropertyExpenseDto) {
        await this.findOne(propertyId, organizationId);

        const expense = this.expenseRepository.create({
            propertyId,
            amount: createDto.amount.toFixed(2),
            expenseDate: createDto.expenseDate,
            expenseCategory: createDto.expenseCategory,
            description: createDto.description.trim(),
        });

        const saved = await this.expenseRepository.save(expense);
        return this.mapExpense(saved);
    }

    async findExpenses(propertyId: string, organizationId: string) {
        await this.findOne(propertyId, organizationId);
        const rows = await this.expenseRepository.find({
            where: { propertyId },
            order: { expenseDate: 'ASC', createdAt: 'ASC' },
        });
        return rows.map((e) => this.mapExpense(e));
    }

    async updateExpense(
        propertyId: string,
        organizationId: string,
        expenseId: string,
        updateDto: UpdatePropertyExpenseDto,
    ) {
        await this.findOne(propertyId, organizationId);
        const expense = await this.expenseRepository.findOne({ where: { id: expenseId, propertyId } });
        if (!expense) throw new NotFoundException('Property expense not found');

        if (updateDto.amount !== undefined) expense.amount = updateDto.amount.toFixed(2);
        if (updateDto.expenseDate !== undefined) expense.expenseDate = updateDto.expenseDate;
        if (updateDto.expenseCategory !== undefined) expense.expenseCategory = updateDto.expenseCategory;
        if (updateDto.description !== undefined) expense.description = updateDto.description.trim();

        const updated = await this.expenseRepository.save(expense);
        return this.mapExpense(updated);
    }

    async removeExpense(propertyId: string, organizationId: string, expenseId: string) {
        await this.findOne(propertyId, organizationId);
        const expense = await this.expenseRepository.findOne({ where: { id: expenseId, propertyId } });
        if (!expense) throw new NotFoundException('Property expense not found');

        await this.expenseRepository.remove(expense);
        return { id: expenseId };
    }

    async getBalance(propertyId: string, organizationId: string, query: PropertyBalanceQueryDto) {
        await this.findOne(propertyId, organizationId);

        const incQb = this.incomeRepository
            .createQueryBuilder('income')
            .where('income.property_id = :propertyId', { propertyId });
        this.applyIncomeDateRange(incQb, query);
        const incRaw = await incQb
            .select('COALESCE(SUM(income.amount), 0)', 'total')
            .addSelect('COUNT(*)', 'count')
            .getRawOne<{ total: string; count: string }>();

        const expQb = this.expenseRepository
            .createQueryBuilder('exp')
            .where('exp.property_id = :propertyId', { propertyId });
        this.applyExpenseDateRange(expQb, query);
        const expRaw = await expQb
            .select('COALESCE(SUM(exp.amount), 0)', 'total')
            .addSelect('COUNT(*)', 'count')
            .getRawOne<{ total: string; count: string }>();

        const totalIncomes = Number(incRaw?.total ?? '0');
        const totalExpenses = Number(expRaw?.total ?? '0');

        return {
            propertyId,
            startDate: query.startDate ?? null,
            endDate: query.endDate ?? null,
            totalIncomes,
            totalExpenses,
            balance: totalIncomes - totalExpenses,
            incomeCount: Number(incRaw?.count ?? '0'),
            expenseCount: Number(expRaw?.count ?? '0'),
        };
    }

    async getExpenseReport(propertyId: string, organizationId: string, query: PropertyExpenseReportQueryDto) {
        await this.findOne(propertyId, organizationId);

        const qb = this.expenseRepository
            .createQueryBuilder('exp')
            .where('exp.property_id = :propertyId', { propertyId })
            .orderBy('exp.expense_date', 'ASC')
            .addOrderBy('exp.createdAt', 'ASC');
        this.applyExpenseDateRange(qb, query);

        const rows = await qb.getMany();
        const mapped = rows.map((r) => this.mapExpense(r));

        const order: PropertyExpenseCategory[] = [
            PropertyExpenseCategory.MANTENIMIENTO,
            PropertyExpenseCategory.IMPUESTO,
            PropertyExpenseCategory.SERVICIO,
        ];
        const byCat = new Map<PropertyExpenseCategory, typeof mapped>();
        for (const m of mapped) {
            const k = m.expenseCategory;
            if (!byCat.has(k)) byCat.set(k, []);
            byCat.get(k)!.push(m);
        }

        const categories = order
            .filter((c) => byCat.has(c))
            .map((category) => {
                const items = byCat.get(category)!;
                const subtotal = items.reduce((s, i) => s + i.amount, 0);
                return { category, subtotal, count: items.length, items };
            });

        return {
            propertyId,
            startDate: query.startDate ?? null,
            endDate: query.endDate ?? null,
            categories,
        };
    }

    async buildPropertyRecordsPdfBuffer(
        propertyId: string,
        organizationId: string,
        query: PropertyReportPdfQueryDto = {},
    ): Promise<{ buffer: Buffer; filename: string }> {
        const property = await this.findOne(propertyId, organizationId);

        const incQ = this.incomeRepository
            .createQueryBuilder('income')
            .where('income.property_id = :propertyId', { propertyId })
            .orderBy('income.income_date', 'ASC')
            .addOrderBy('income.createdAt', 'ASC');
        this.applyIncomeDateRange(incQ, query);
        const incomes = await incQ.getMany();

        const expQ = this.expenseRepository
            .createQueryBuilder('exp')
            .where('exp.property_id = :propertyId', { propertyId })
            .orderBy('exp.expense_date', 'ASC')
            .addOrderBy('exp.createdAt', 'ASC');
        this.applyExpenseDateRange(expQ, query);
        const expenses = await expQ.getMany();

        const totalIncomes = incomes.reduce((s, r) => s + Number(r.amount), 0);
        const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0);
        const balance = totalIncomes - totalExpenses;

        const order: PropertyExpenseCategory[] = [
            PropertyExpenseCategory.MANTENIMIENTO,
            PropertyExpenseCategory.IMPUESTO,
            PropertyExpenseCategory.SERVICIO,
        ];
        const byCat = new Map<PropertyExpenseCategory, PropertyExpense[]>();
        for (const row of expenses) {
            if (!byCat.has(row.expenseCategory)) byCat.set(row.expenseCategory, []);
            byCat.get(row.expenseCategory)!.push(row);
        }
        const reportCategories = order
            .filter((c) => byCat.has(c))
            .map((category) => {
                const items = byCat.get(category)!;
                const subtotal = items.reduce((s, i) => s + Number(i.amount), 0);
                return { category, subtotal, count: items.length };
            });

        const periodNote =
            query.startDate || query.endDate
                ? `Periodo: ${query.startDate ?? '...'} a ${query.endDate ?? '...'}`
                : 'Periodo: todos los registros';

        const buffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(18).text('Reporte de propiedad', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#000000');
            doc.text(`Codigo: ${property.code}`);
            doc.text(`Titulo: ${property.title}`);
            doc.fontSize(9).fillColor('#444444').text(periodNote);
            doc.fillColor('#000000').fontSize(11);
            doc.moveDown();

            doc.fontSize(12).text('Balance (ingresos - gastos)', { underline: true });
            doc.moveDown(0.3);
            doc.fontSize(10);
            doc.text(`Total ingresos: ${formatCop(totalIncomes)}`);
            doc.text(`Total gastos: ${formatCop(totalExpenses)}`);
            doc.fontSize(11).text(`Balance: ${formatCop(balance)}`, { continued: false });
            doc.moveDown();

            doc.fontSize(12).text('Gastos por categoria (subtotales)', { underline: true });
            doc.moveDown(0.3);
            doc.fontSize(10);
            if (reportCategories.length === 0) {
                doc.text('Sin gastos en el periodo.');
            } else {
                for (const cat of reportCategories) {
                    doc.text(`${EXPENSE_CATEGORY_LABEL[cat.category]}: ${formatCop(cat.subtotal)} (${cat.count} mov.)`);
                }
            }
            doc.moveDown();

            doc.fontSize(12).text('Detalle de gastos', { underline: true });
            doc.moveDown(0.3);
            if (expenses.length === 0) {
                doc.fontSize(10).text('No hay gastos.');
            } else {
                doc.fontSize(9);
                expenses.forEach((row, index) => {
                    if (doc.y > 720) doc.addPage();
                    const line = `${index + 1}. ${row.expenseDate} | ${EXPENSE_CATEGORY_LABEL[row.expenseCategory]} | ${formatCop(Number(row.amount))} | ${row.description.replace(/\s+/g, ' ')}`;
                    doc.text(line, { width: 500 });
                    doc.moveDown(0.22);
                });
            }
            doc.moveDown();

            doc.fontSize(12).text('Detalle de ingresos', { underline: true });
            doc.moveDown(0.3);
            if (incomes.length === 0) {
                doc.fontSize(10).text('No hay ingresos.');
            } else {
                doc.fontSize(9);
                incomes.forEach((row, index) => {
                    if (doc.y > 720) doc.addPage();
                    const line = `${index + 1}. ${row.incomeDate} | ${row.incomeType} | ${formatCop(Number(row.amount))} | ${row.description.replace(/\s+/g, ' ')}`;
                    doc.text(line, { width: 500 });
                    doc.moveDown(0.22);
                });
            }

            doc.moveDown();
            doc.fontSize(8).fillColor('#666666').text(`Generado: ${new Date().toISOString()}`, { align: 'right' });

            doc.end();
        });

        const safeCode = property.code.replace(/[^\w-]+/g, '_');
        return { buffer, filename: `propiedad-${safeCode}-reporte.pdf` };
    }

    private applyIncomeDateRange(qb: SelectQueryBuilder<PropertyIncome>, query: DateRangeFilter) {
        if (query.startDate) {
            qb.andWhere('income.income_date >= :startDate', { startDate: query.startDate });
        }
        if (query.endDate) {
            qb.andWhere('income.income_date <= :endDate', { endDate: query.endDate });
        }
    }

    private applyExpenseDateRange(qb: SelectQueryBuilder<PropertyExpense>, query: DateRangeFilter) {
        if (query.startDate) {
            qb.andWhere('exp.expense_date >= :startDate', { startDate: query.startDate });
        }
        if (query.endDate) {
            qb.andWhere('exp.expense_date <= :endDate', { endDate: query.endDate });
        }
    }

    private mapIncome(income: PropertyIncome) {
        return {
            id: income.id,
            propertyId: income.propertyId,
            amount: Number(income.amount),
            incomeDate: income.incomeDate,
            incomeType: income.incomeType,
            description: income.description,
            createdAt: income.createdAt,
            updatedAt: income.updatedAt,
        };
    }

    private mapExpense(expense: PropertyExpense) {
        return {
            id: expense.id,
            propertyId: expense.propertyId,
            amount: Number(expense.amount),
            expenseDate: expense.expenseDate,
            expenseCategory: expense.expenseCategory,
            description: expense.description,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
        };
    }

    async search(organizationId: string, userId: string | undefined, filter: PropertySearchQueryDto) {
        const { page = 1, limit = 20, countOnly, assignedToMe, ...rest } = filter;
        const qb = this.createOrgSearchQueryBuilder(organizationId, userId, { ...rest, assignedToMe });

        if (countOnly) {
            const count = await qb.getCount();
            return { count };
        }

        const skip = (page - 1) * limit;
        const [data, total] = await qb
            .orderBy('property.updatedAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            count: total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            items: data.map((p) => toPropertySummaryEs(p)),
        };
    }

    async getStats(organizationId: string, userId: string | undefined, filter: PropertyStatsQueryDto = {}) {
        const baseQb = this.createOrgSearchQueryBuilder(organizationId, userId, {
            assignedToMe: filter.assignedToMe,
        });

        const total = await baseQb.getCount();

        const byCommercialStatus = await this.createOrgSearchQueryBuilder(organizationId, userId, {
            assignedToMe: filter.assignedToMe,
        })
            .select('property.commercialStatus', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('property.commercialStatus')
            .getRawMany<{ status: PropertyCommercialStatus; count: string }>();

        const byPropertyType = await this.createOrgSearchQueryBuilder(organizationId, userId, {
            assignedToMe: filter.assignedToMe,
        })
            .select('property.propertyType', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('property.propertyType')
            .getRawMany<{ type: string; count: string }>();

        const byCity = await this.createOrgSearchQueryBuilder(organizationId, userId, {
            assignedToMe: filter.assignedToMe,
        })
            .select('location.city', 'city')
            .addSelect('COUNT(*)', 'count')
            .groupBy('location.city')
            .orderBy('count', 'DESC')
            .limit(10)
            .getRawMany<{ city: string; count: string }>();

        return {
            total,
            porEstadoComercial: byCommercialStatus.map((r) => ({
                estado: commercialStatusToEs(r.status),
                cantidad: Number(r.count),
            })),
            porTipo: byPropertyType.map((r) => ({
                tipo: propertyTypeToEs(r.type as PropertyType),
                cantidad: Number(r.count),
            })),
            topCiudades: byCity
                .filter((r) => r.city)
                .map((r) => ({ ciudad: r.city, cantidad: Number(r.count) })),
        };
    }

    async findSummary(id: string, organizationId: string) {
        const property = await this.repository.findOne({
            where: { id, organizationId },
            relations: { location: true, rentalDetail: true, feature: true },
        });
        if (!property) throw new NotFoundException('Property not found');
        return toPropertySummaryEs(property);
    }

    private createOrgSearchQueryBuilder(
        organizationId: string,
        userId: string | undefined,
        filter: Omit<PropertySearchQueryDto, 'page' | 'limit' | 'countOnly'>,
    ) {
        const qb = this.repository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.location', 'location')
            .leftJoinAndSelect('property.rentalDetail', 'rentalDetail')
            .leftJoinAndSelect('property.feature', 'feature')
            .where('property.organizationId = :organizationId', { organizationId });

        if (filter.assignedToMe) {
            if (!userId) {
                qb.andWhere('1 = 0');
            } else {
                qb.innerJoin('property_agents', 'pa', 'pa.property_id = property.id AND pa.user_id = :userId', {
                    userId,
                });
            }
        }

        if (filter.propertyType) {
            qb.andWhere('property.propertyType = :propertyType', { propertyType: filter.propertyType });
        }

        if (filter.commercialStatus) {
            qb.andWhere('property.commercialStatus = :commercialStatus', {
                commercialStatus: filter.commercialStatus,
            });
        }

        if (filter.publicationStatus) {
            qb.andWhere('property.publicationStatus = :publicationStatus', {
                publicationStatus: filter.publicationStatus,
            });
        }

        if (filter.minRent !== undefined) {
            qb.andWhere('CAST(rentalDetail.monthlyRent AS DECIMAL) >= :minRent', { minRent: filter.minRent });
        }

        if (filter.maxRent !== undefined) {
            qb.andWhere('CAST(rentalDetail.monthlyRent AS DECIMAL) <= :maxRent', { maxRent: filter.maxRent });
        }

        if (filter.city) {
            qb.andWhere('location.city ILIKE :city', { city: `%${filter.city}%` });
        }

        if (filter.country) {
            qb.andWhere('location.country ILIKE :country', { country: `%${filter.country}%` });
        }

        if (filter.q?.trim()) {
            const q = `%${filter.q.trim()}%`;
            qb.andWhere('(property.title ILIKE :q OR property.code ILIKE :q)', { q });
        }

        return qb;
    }

    async findPublicProperties(filter: PublicPropertyFilterDto) {
        const { propertyType, minPrice, maxPrice, city, country, organizationId, q, page = 1, limit = 12 } = filter;
        const skip = (page - 1) * limit;

        const queryBuilder = this.repository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.images', 'images')
            .leftJoinAndSelect('property.location', 'location')
            .leftJoinAndSelect('property.rentalDetail', 'rentalDetail')
            .leftJoinAndSelect('property.feature', 'feature')
            .leftJoinAndSelect('property.organization', 'organization')
            .where('property.commercialStatus = :status', { status: PropertyCommercialStatus.AVAILABLE })
            .andWhere('property.publicationStatus = :pubStatus', { pubStatus: PropertyPublicationStatus.PUBLISHED })
            .andWhere('property.isVisible = :isVisible', { isVisible: true });

        if (propertyType) {
            queryBuilder.andWhere('property.propertyType = :propertyType', { propertyType });
        }

        if (minPrice !== undefined) {
            queryBuilder.andWhere('CAST(rentalDetail.monthlyRent AS DECIMAL) >= :minPrice', { minPrice });
        }

        if (maxPrice !== undefined) {
            queryBuilder.andWhere('CAST(rentalDetail.monthlyRent AS DECIMAL) <= :maxPrice', { maxPrice });
        }

        if (city) {
            queryBuilder.andWhere('location.city ILIKE :city', { city: `%${city}%` });
        }

        if (country) {
            queryBuilder.andWhere('location.country ILIKE :country', { country: `%${country}%` });
        }

        if (organizationId) {
            queryBuilder.andWhere('property.organizationId = :organizationId', { organizationId });
        }

        if (q?.trim()) {
            const term = `%${q.trim()}%`;
            queryBuilder.andWhere(
                '(property.title ILIKE :term OR property.code ILIKE :term OR location.city ILIKE :term OR location.address ILIKE :term)',
                { term },
            );
        }

        const [data, total] = await queryBuilder
            .orderBy('property.updatedAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data: data.map((property) => this.mapPublicProperty(this.attachCover(property))),
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findPublicPropertyById(id: string) {
        const property = await this.repository.findOne({
            where: {
                id,
                commercialStatus: PropertyCommercialStatus.AVAILABLE,
                publicationStatus: PropertyPublicationStatus.PUBLISHED,
                isVisible: true,
            },
            relations: {
                images: true,
                rentalDetail: true,
                location: true,
                feature: true,
                organization: true,
            },
        });

        if (!property) {
            throw new NotFoundException('Property not found or not available');
        }

        return this.mapPublicProperty(this.attachCover(property));
    }

    mapPublicProperty(property: Property & { coverImageUrl?: string | null }) {
        const cover = property.coverImageUrl ?? property.images?.find((i) => i.isCover)?.imageUrl ?? property.images?.[0]?.imageUrl ?? null;

        return {
            id: property.id,
            code: property.code,
            title: property.title,
            description: property.description,
            propertyType: property.propertyType,
            commercialStatus: property.commercialStatus,
            location: {
                country: property.location?.country ?? '',
                city: property.location?.city ?? '',
                address: property.location?.address,
            },
            feature: {
                bedrooms: property.feature?.bedrooms ?? 0,
                bathrooms: property.feature?.bathrooms ?? 0,
                isFurnished: property.feature?.isFurnished ?? false,
                petsAllowed: property.feature?.petsAllowed ?? false,
            },
            rentalDetail: {
                monthlyRent: Number(property.rentalDetail?.monthlyRent ?? 0),
                currency: property.rentalDetail?.currency ?? 'CLP',
            },
            organization: property.organization
                ? {
                      id: property.organization.id,
                      name: property.organization.name,
                      slug: property.organization.slug,
                  }
                : undefined,
            images: (property.images ?? []).map((image) => ({
                id: image.id,
                imageUrl: image.imageUrl,
                isCover: image.isCover,
            })),
            coverImageUrl: cover ?? undefined,
        };
    }

    private attachCover(property: Property): Property & { coverImageUrl: string | null } {
        const cover = property.images?.find((image) => image.isCover) ?? property.images?.[0] ?? null;
        return Object.assign(property, { coverImageUrl: cover?.imageUrl ?? null });
    }
}

function formatCop(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 2,
    }).format(value);
}
