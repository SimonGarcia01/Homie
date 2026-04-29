import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OwnersService } from './owners.service';

type RequestWithOrg = { user: { organizationId: string } };

@ApiTags('owners')
@ApiBearerAuth()
@Controller('owners')
export class OwnersController {
    constructor(private readonly service: OwnersService) {}

    @Get()
    findOptions(@Req() req: RequestWithOrg) {
        return this.service.findOptionsForOrganization(req.user.organizationId);
    }
}
