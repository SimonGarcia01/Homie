import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { PropertyCommercialStatus, PropertyPublicationStatus } from '../../common/enums';

import { CreatePropertyIncomeDto } from './dto/create-property-income.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyIncomeSummaryQueryDto } from './dto/property-income-summary-query.dto';
import { UpdatePropertyIncomeDto } from './dto/update-property-income.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyIncome } from './entities/property-income.entity';
import { Property } from './entities/property.entity';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private readonly repository: Repository<Property>,
        @InjectRepository(PropertyIncome)
        private readonly incomeRepository: Repository<PropertyIncome>,
    ) {}

    async create(createDto: CreatePropertyDto, organizationId: string) {
        const entity = this.repository.create({
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
        return this.repository.save(entity);
    }

    findAll(organizationId: string) {
        return this.repository.find({
            where: { organizationId },
            order: { updatedAt: 'DESC' },
        });
    }

    async findOne(id: string, organizationId: string) {
        const entity = await this.repository.findOne({ where: { id, organizationId } });
        if (!entity) throw new NotFoundException('Property not found');
        return entity;
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
        return this.repository.save(entity);
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
        this.applyDateRange(qb, query);

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

    async buildPropertyRecordsPdfBuffer(
        propertyId: string,
        organizationId: string,
    ): Promise<{ buffer: Buffer; filename: string }> {
        const property = await this.findOne(propertyId, organizationId);
        const incomes = await this.incomeRepository.find({
            where: { propertyId },
            order: { incomeDate: 'ASC', createdAt: 'ASC' },
        });

        const summaryQ = this.incomeRepository
            .createQueryBuilder('income')
            .where('income.property_id = :propertyId', { propertyId });
        const rawTotal = await summaryQ
            .select('COALESCE(SUM(income.amount), 0)', 'total')
            .getRawOne<{ total: string }>();
        const totalAll = Number(rawTotal?.total ?? '0');

        const buffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(18).text('Registros de propiedad', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11);
            doc.text(`Codigo: ${property.code}`);
            doc.text(`Titulo: ${property.title}`);
            if (property.description) {
                doc.text(`Descripcion: ${property.description}`);
            }
            doc.text(`Tipo: ${property.propertyType}`);
            doc.text(`Estado comercial: ${property.commercialStatus}`);
            doc.text(`Publicacion: ${property.publicationStatus}`);
            doc.moveDown();

            doc.fontSize(12).text('Resumen de ingresos', { underline: true });
            doc.moveDown(0.3);
            doc.fontSize(10).text(`Total acumulado (todos los registros): ${formatCop(totalAll)}`);
            doc.text(`Cantidad de movimientos: ${incomes.length}`);
            doc.moveDown();

            doc.fontSize(12).text('Detalle cronologico', { underline: true });
            doc.moveDown(0.3);

            if (incomes.length === 0) {
                doc.fontSize(10).text('No hay ingresos registrados.');
            } else {
                doc.fontSize(9);
                incomes.forEach((row, index) => {
                    if (doc.y > 720) {
                        doc.addPage();
                    }
                    const line = `${index + 1}. ${row.incomeDate} | ${row.incomeType} | ${formatCop(Number(row.amount))} | ${row.description.replace(/\s+/g, ' ')}`;
                    doc.text(line, { width: 500 });
                    doc.moveDown(0.25);
                });
            }

            doc.moveDown();
            doc.fontSize(8).fillColor('#666666').text(`Generado: ${new Date().toISOString()}`, { align: 'right' });

            doc.end();
        });

        const safeCode = property.code.replace(/[^\w-]+/g, '_');
        return { buffer, filename: `propiedad-${safeCode}-registros.pdf` };
    }

    private applyDateRange(qb: SelectQueryBuilder<PropertyIncome>, query: PropertyIncomeSummaryQueryDto) {
        if (query.startDate) {
            qb.andWhere('income.income_date >= :startDate', { startDate: query.startDate });
        }

        if (query.endDate) {
            qb.andWhere('income.income_date <= :endDate', { endDate: query.endDate });
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
}

function formatCop(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 2,
    }).format(value);
}
