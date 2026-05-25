import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import {
    PropertyCommercialStatus,
    PropertyPublicationStatus,
    PropertyType,
} from '../../../common/enums';

function toOptionalBoolean(value: unknown): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return undefined;
}

export class PropertySearchQueryDto {
    @ApiPropertyOptional({ enum: PropertyType })
    @IsOptional()
    @IsEnum(PropertyType)
    propertyType?: PropertyType;

    @ApiPropertyOptional({ enum: PropertyCommercialStatus })
    @IsOptional()
    @IsEnum(PropertyCommercialStatus)
    commercialStatus?: PropertyCommercialStatus;

    @ApiPropertyOptional({ enum: PropertyPublicationStatus })
    @IsOptional()
    @IsEnum(PropertyPublicationStatus)
    publicationStatus?: PropertyPublicationStatus;

    @ApiPropertyOptional({ description: 'Ciudad (búsqueda parcial)' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'País (búsqueda parcial)' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ description: 'Arriendo mínimo mensual' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minRent?: number;

    @ApiPropertyOptional({ description: 'Arriendo máximo mensual' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxRent?: number;

    @ApiPropertyOptional({ description: 'Buscar en título o código' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ description: 'Solo propiedades asignadas al usuario autenticado' })
    @IsOptional()
    @Transform(({ value }) => toOptionalBoolean(value))
    @IsBoolean()
    assignedToMe?: boolean;

    @ApiPropertyOptional({ description: 'Devolver solo el conteo' })
    @IsOptional()
    @Transform(({ value }) => toOptionalBoolean(value))
    @IsBoolean()
    countOnly?: boolean;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20, maximum: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number = 20;
}

export class PropertyStatsQueryDto {
    @ApiPropertyOptional({ description: 'Solo propiedades asignadas al usuario autenticado' })
    @IsOptional()
    @Transform(({ value }) => toOptionalBoolean(value))
    @IsBoolean()
    assignedToMe?: boolean;
}
