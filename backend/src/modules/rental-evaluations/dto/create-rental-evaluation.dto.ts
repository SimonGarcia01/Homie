import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRentalEvaluationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    organizationId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;
}
