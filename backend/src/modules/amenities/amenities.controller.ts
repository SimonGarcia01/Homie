import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('amenities')
@ApiBearerAuth()
@Controller('amenities')
export class AmenitiesController {}
