import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/auth/public.decorator';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

    @Public()
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto, (payload) => this.jwtService.sign(payload));
    }

    @ApiBearerAuth()
    @Post('logout')
    logout() {
        return this.authService.logout();
    }

    @ApiBearerAuth()
    @Get('me')
    async me(@Req() req: { user: { id: string } }) {
        return this.authService.getProfile(req.user.id);
    }

    @ApiBearerAuth()
    @Patch('me')
    async updateMe(@Req() req: { user: { id: string } }, @Body() dto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.id, dto);
    }
}
