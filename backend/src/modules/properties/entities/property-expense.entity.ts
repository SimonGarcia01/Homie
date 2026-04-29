import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { PropertyExpenseCategory } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';

import { Property } from './property.entity';

@Entity({ name: 'property_expenses' })
export class PropertyExpense extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @Column({ type: 'numeric', precision: 14, scale: 2 })
    amount!: string;

    @Column({ type: 'date', name: 'expense_date' })
    expenseDate!: string;

    @Column({ type: 'enum', enum: PropertyExpenseCategory, name: 'expense_category' })
    expenseCategory!: PropertyExpenseCategory;

    @Column({ type: 'text' })
    description!: string;

    @ManyToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property?: Property;
}
