import { IsDateString, IsNumberString, IsOptional, IsUUID } from 'class-validator';

export class CreateRentalContractDto {
    @IsDateString()
    startDate!: string;

    @IsDateString()
    endDate!: string;

    @IsNumberString()
    monthlyRent!: string;

    @IsOptional()
    @IsUUID()
    tenantContactId?: string;
}
