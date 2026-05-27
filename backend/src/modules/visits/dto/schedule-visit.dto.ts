import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

import { VisitType } from '../../../common/enums';

export class ScheduleVisitDto {
    @ApiProperty()
    @IsUUID()
    leadId!: string;

    @ApiProperty()
    @IsUUID()
    propertyId!: string;

    @ApiProperty()
    @IsDateString()
    scheduledAt!: string;

    @ApiPropertyOptional({ enum: VisitType, default: VisitType.IN_PERSON })
    @IsOptional()
    @IsEnum(VisitType)
    visitType?: VisitType;

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
