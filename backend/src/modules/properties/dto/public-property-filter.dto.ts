import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { PropertyType } from '../../../common/enums';

export class PublicPropertyFilterDto {
    @ApiPropertyOptional({ enum: PropertyType, description: 'Tipo de propiedad' })
    @IsOptional()
    @IsEnum(PropertyType)
    propertyType?: PropertyType;

    @ApiPropertyOptional({ description: 'Precio mínimo', example: 500000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Precio máximo', example: 5000000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({ description: 'Ciudad', example: 'Cali' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'País', example: 'Colombia' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Resultados por página', example: 12, default: 12 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number = 12;
}
