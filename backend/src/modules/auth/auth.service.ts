import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserRoleName } from '../../common/enums';
import { OrganizationsService } from '../organizations/organizations.service';
import { PipelinesService } from '../opportunities/pipelines.service';
import { Role } from '../roles/entities/role.entity';
import { UsersService } from '../users/users.service';

import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly organizationsService: OrganizationsService,
        private readonly pipelinesService: PipelinesService,
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

    async register(dto: RegisterDto, signToken: (payload: Record<string, unknown>) => string) {
        const existing = await this.usersService.findByEmailForAuth(dto.email);
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const adminRole = await this.getAdminRole();

        const organization = await this.organizationsService.create({
            name: dto.organizationName,
            country: dto.country,
        });

        await this.pipelinesService.ensureDefaultPipeline(organization.id);

        const user = await this.usersService.create({
            organizationId: organization.id,
            roleId: adminRole.id,
            email: dto.email,
            password: dto.password,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            isActive: true,
        });

        const accessToken = signToken({
            sub: user.id,
            email: user.email,
            organizationId: user.organizationId,
            role: UserRoleName.ADMIN,
        });

        await this.usersService.markLogin(user.id);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: UserRoleName.ADMIN,
                organizationId: user.organizationId,
            },
        };
    }

    logout() {
        return { message: 'Logout handled on client side.' };
    }

    async getProfile(userId: string) {
        const user = await this.usersService.findOne(userId);
        const role = await this.rolesRepository.findOne({ where: { id: user.roleId } });
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: user.organizationId,
            role: role?.name ?? 'agent',
            isActive: user.isActive,
        };
    }

    private async getAdminRole() {
        let role = await this.rolesRepository.findOne({ where: { name: UserRoleName.ADMIN } });
        if (!role) {
            role = await this.rolesRepository.save(
                this.rolesRepository.create({ name: UserRoleName.ADMIN, description: 'Administrator' }),
            );
        }
        return role;
    }
}
