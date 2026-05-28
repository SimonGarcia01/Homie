import { IsDateString, IsEnum, IsNumberString, IsOptional } from 'class-validator';

import { RentalContractStatus } from '../../../common/enums';

export class UpdateRentalContractDto {
    @IsOptional()
    @IsEnum(RentalContractStatus)
    status?: RentalContractStatus;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsNumberString()
    monthlyRent?: string;
}
