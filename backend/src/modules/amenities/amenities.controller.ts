import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AmenitiesService } from './amenities.service';

@ApiTags('amenities')
@ApiBearerAuth()
@Controller('amenities')
export class AmenitiesController {
    constructor(private readonly service: AmenitiesService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }
}
