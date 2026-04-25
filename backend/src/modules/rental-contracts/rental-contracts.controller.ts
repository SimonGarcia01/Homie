import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('rental-contracts')
@ApiBearerAuth()
@Controller('rental-contracts')
export class RentalContractsController {}
