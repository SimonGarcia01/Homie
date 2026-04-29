import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsString, MaxLength, Min } from 'class-validator';

import { PropertyExpenseCategory } from '../../../common/enums';

export class CreatePropertyExpenseDto {
    @ApiProperty({ example: 350000 })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    amount!: number;

    @ApiProperty({ example: '2026-04-29' })
    @IsDateString()
    expenseDate!: string;

    @ApiProperty({ enum: PropertyExpenseCategory, example: PropertyExpenseCategory.MANTENIMIENTO })
    @IsEnum(PropertyExpenseCategory)
    expenseCategory!: PropertyExpenseCategory;

    @ApiProperty({
        example: 'Reparacion de filtraciones en bano',
        description: 'Descripcion detallada del gasto (libre)',
        maxLength: 500,
    })
    @IsString()
    @MaxLength(500)
    description!: string;
}
