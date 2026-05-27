import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PROSPECT_AUTH_KEY } from './prospect-auth.decorator';

@Injectable()
export class ProspectAuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiresProspect = this.reflector.getAllAndOverride<boolean>(IS_PROSPECT_AUTH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiresProspect) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{ user?: { accountType?: string } }>();
        if (request.user?.accountType !== 'prospect') {
            throw new ForbiddenException('Prospect account required');
        }

        return true;
    }
}
