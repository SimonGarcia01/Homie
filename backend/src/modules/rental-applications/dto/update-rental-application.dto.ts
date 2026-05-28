import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { RentalApplicationStatus } from '../../../common/enums';

export class UpdateRentalApplicationDto {
    @ApiPropertyOptional({ enum: RentalApplicationStatus })
    @IsOptional()
    @IsEnum(RentalApplicationStatus)
    status?: RentalApplicationStatus;
}
