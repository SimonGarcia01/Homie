import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('owners')
@ApiBearerAuth()
@Controller('owners')
export class OwnersController {}
