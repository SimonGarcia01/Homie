import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { ProspectInquiryType } from '../entities/prospect-inquiry.entity';

export class CreateInquiryDto {
    @ApiProperty()
    @IsUUID()
    propertyId!: string;

    @ApiProperty({ enum: ProspectInquiryType, default: ProspectInquiryType.VISIT })
    @IsEnum(ProspectInquiryType)
    type!: ProspectInquiryType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    message?: string;

    @ApiPropertyOptional({ description: 'this_week | next_week | flexible' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    preferredTiming?: string;
}
