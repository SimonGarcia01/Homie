import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Role } from '../roles/entities/role.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,
    ) {}

    async login(email: string, password: string, signToken: (payload: Record<string, unknown>) => string) {
        const user = await this.usersService.findByEmailForAuth(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const role = await this.rolesRepository.findOne({
            where: { id: user.roleId },
        });

        const accessToken = signToken({
            sub: user.id,
            email: user.email,
            organizationId: user.organizationId,
            role: role?.name ?? 'agent',
        });

        await this.usersService.markLogin(user.id);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: role?.name ?? 'agent',
                organizationId: user.organizationId,
            },
        };
    }

    logout() {
        return { message: 'Logout handled on client side.' };
    }
}
