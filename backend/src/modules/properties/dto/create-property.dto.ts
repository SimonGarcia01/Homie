import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
} from 'class-validator';

import { PropertyCommercialStatus, PropertyPublicationStatus, PropertyType } from '../../../common/enums';

export class CreatePropertyDto {
    @ApiProperty()
    @IsUUID()
    ownerId!: string;

    @ApiProperty({ example: 'HOM-001', maxLength: 50 })
    @IsString()
    @MaxLength(50)
    code!: string;

    @ApiProperty({ example: 'Apartamento norte', maxLength: 180 })
    @IsString()
    @MaxLength(180)
    title!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: PropertyType })
    @IsEnum(PropertyType)
    propertyType!: PropertyType;

    @ApiProperty({ example: 1500000, description: 'Monthly rent (price) in the chosen currency' })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    monthlyRent!: number;

    @ApiPropertyOptional({ example: 'COP', default: 'COP', maxLength: 10 })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    currency?: string;

    @ApiProperty({ example: 'Cali', maxLength: 120 })
    @IsString()
    @MinLength(1)
    @MaxLength(120)
    city!: string;

    @ApiPropertyOptional({ example: 'Colombia', default: 'Colombia', maxLength: 80 })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    country?: string;

    @ApiPropertyOptional({ example: 'Av. Roosevelt 23-45', maxLength: 255 })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    address?: string;

    @ApiPropertyOptional({ enum: PropertyCommercialStatus, default: PropertyCommercialStatus.AVAILABLE })
    @IsOptional()
    @IsEnum(PropertyCommercialStatus)
    commercialStatus?: PropertyCommercialStatus;

    @ApiPropertyOptional({ enum: PropertyPublicationStatus, default: PropertyPublicationStatus.DRAFT })
    @IsOptional()
    @IsEnum(PropertyPublicationStatus)
    publicationStatus?: PropertyPublicationStatus;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isVisible?: boolean;
}
