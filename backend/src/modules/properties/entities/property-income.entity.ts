import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { PropertyIncomeType } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';

import { Property } from './property.entity';

@Entity({ name: 'property_incomes' })
export class PropertyIncome extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @Column({ type: 'numeric', precision: 14, scale: 2 })
    amount!: string;

    @Column({ type: 'date', name: 'income_date' })
    incomeDate!: string;

    @Column({ type: 'enum', enum: PropertyIncomeType, name: 'income_type' })
    incomeType!: PropertyIncomeType;

    @Column({ type: 'text' })
    description!: string;

    @ManyToOne(() => Property, (property) => property.incomes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property?: Property;
}
