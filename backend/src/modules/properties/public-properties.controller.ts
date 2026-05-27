import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Public } from '../../common/auth/public.decorator';

import { PublicPropertyFilterDto } from './dto/public-property-filter.dto';
import { PropertiesService } from './properties.service';

@ApiTags('public-properties')
@Public()
@Controller('public/properties')
export class PublicPropertiesController {
    constructor(private readonly service: PropertiesService) {}

    @Get()
    @ApiOperation({ summary: 'Obtener catálogo público de propiedades disponibles' })
    @ApiResponse({ status: 200, description: 'Lista de propiedades paginada' })
    findAll(@Query() filter: PublicPropertyFilterDto) {
        return this.service.findPublicProperties(filter);
    }

    @Get('meta/organizations')
    @ApiOperation({ summary: 'Brokers con propiedades publicadas en el catálogo' })
    findOrganizations() {
        return this.service.findPublicOrganizations();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalle público de una propiedad' })
    @ApiResponse({ status: 200, description: 'Detalle de la propiedad' })
    @ApiResponse({ status: 404, description: 'Propiedad no encontrada o no disponible' })
    findOne(@Param('id') id: string) {
        return this.service.findPublicPropertyById(id);
    }
}
