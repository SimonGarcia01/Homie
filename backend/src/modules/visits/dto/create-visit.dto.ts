import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

import { VisitType } from '../../../common/enums';

export class CreateVisitDto {
    @ApiProperty()
    @IsUUID()
    opportunityId!: string;

    @ApiProperty()
    @IsUUID()
    propertyId!: string;

    @ApiProperty()
    @IsUUID()
    contactId!: string;

    @ApiProperty({ enum: VisitType, default: VisitType.IN_PERSON })
    @IsEnum(VisitType)
    visitType!: VisitType;

    @ApiProperty()
    @IsDateString()
    scheduledAt!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(15)
    durationMin?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}
