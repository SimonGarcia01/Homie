import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('visits')
@ApiBearerAuth()
@Controller('visits')
export class VisitsController {}
