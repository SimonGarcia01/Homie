import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsString, MaxLength, Min } from 'class-validator';

import { PropertyIncomeType } from '../../../common/enums';

export class CreatePropertyIncomeDto {
    @ApiProperty({ example: 1500000 })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    amount!: number;

    @ApiProperty({ example: '2026-04-29' })
    @IsDateString()
    incomeDate!: string;

    @ApiProperty({ enum: PropertyIncomeType, example: PropertyIncomeType.ARRIENDO })
    @IsEnum(PropertyIncomeType)
    incomeType!: PropertyIncomeType;

    @ApiProperty({ example: 'Pago de arriendo de abril', maxLength: 500 })
    @IsString()
    @MaxLength(500)
    description!: string;
}
