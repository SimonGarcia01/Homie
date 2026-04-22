import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {}
