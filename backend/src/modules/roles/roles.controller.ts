import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
    constructor(private readonly service: RolesService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }
}
