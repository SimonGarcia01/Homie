import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/auth/public.decorator';
import { ProspectAuth } from '../../common/auth/prospect-auth.decorator';

import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { ProspectLoginDto, ProspectRegisterDto } from './dto/prospect-register.dto';
import { ProspectsService } from './prospects.service';

type ProspectRequest = { user: { id: string; accountType?: string } };

@ApiTags('prospect')
@Controller('prospect')
export class ProspectsController {
    constructor(
        private readonly service: ProspectsService,
        private readonly jwtService: JwtService,
    ) {}

    @Public()
    @Post('auth/register')
    register(@Body() dto: ProspectRegisterDto) {
        return this.service.register(dto, (payload) => this.jwtService.sign(payload));
    }

    @Public()
    @Post('auth/login')
    login(@Body() dto: ProspectLoginDto) {
        return this.service.login(dto, (payload) => this.jwtService.sign(payload));
    }

    @ProspectAuth()
    @ApiBearerAuth()
    @Get('auth/me')
    me(@Req() req: ProspectRequest) {
        return this.service.getProfile(req.user.id);
    }

    @ProspectAuth()
    @ApiBearerAuth()
    @Get('favorites')
    listFavorites(@Req() req: ProspectRequest) {
        return this.service.listFavorites(req.user.id);
    }

    @ProspectAuth()
    @ApiBearerAuth()
    @Post('favorites/:propertyId')
    addFavorite(@Req() req: ProspectRequest, @Param('propertyId') propertyId: string) {
        return this.service.addFavorite(req.user.id, propertyId);
    }

    @ProspectAuth()
    @ApiBearerAuth()
    @Delete('favorites/:propertyId')
    removeFavorite(@Req() req: ProspectRequest, @Param('propertyId') propertyId: string) {
        return this.service.removeFavorite(req.user.id, propertyId);
    }

    @ProspectAuth()
    @ApiBearerAuth()
    @Get('inquiries')
    listInquiries(@Req() req: ProspectRequest) {
        return this.service.listInquiries(req.user.id);
    }

    @ProspectAuth()
    @ApiBearerAuth()
    @Post('inquiries')
    createInquiry(@Req() req: ProspectRequest, @Body() dto: CreateInquiryDto) {
        return this.service.createInquiry(req.user.id, dto);
    }

    @ProspectAuth()
    @ApiBearerAuth()
    @Get('favorites/:propertyId/status')
    favoriteStatus(@Req() req: ProspectRequest, @Param('propertyId') propertyId: string) {
        return this.service.isFavorite(req.user.id, propertyId).then((isFavorite) => ({ isFavorite }));
    }
}
