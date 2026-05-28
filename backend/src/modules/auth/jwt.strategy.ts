import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret'),
        });
    }

    validate(payload: {
        sub: string;
        email: string;
        accountType?: string;
        organizationId?: string;
        role?: string;
    }) {
        if (payload.accountType === 'prospect') {
            return {
                id: payload.sub,
                email: payload.email,
                accountType: 'prospect' as const,
            };
        }

        return {
            id: payload.sub,
            email: payload.email,
            organizationId: payload.organizationId,
            role: payload.role,
            accountType: 'staff' as const,
        };
    }
}
