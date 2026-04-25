import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('rental-applications')
@ApiBearerAuth()
@Controller('rental-applications')
export class RentalApplicationsController {}
