import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/auth/public.decorator';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
    ) {}

    @Public()
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto.email, dto.password, (payload) => this.jwtService.sign(payload));
    }

    @ApiBearerAuth()
    @Post('logout')
    logout() {
        return this.authService.logout();
    }

    @ApiBearerAuth()
    @Get('me')
    me(@Req() req: { user: unknown }) {
        return req.user;
    }
}
