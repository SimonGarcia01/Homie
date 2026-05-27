import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async create(createUserDto: CreateUserDto) {
        const passwordHash = await bcrypt.hash(createUserDto.password, 10);
        const user = this.usersRepository.create({
            organizationId: createUserDto.organizationId,
            roleId: createUserDto.roleId,
            email: createUserDto.email.toLowerCase(),
            passwordHash,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            phone: createUserDto.phone,
            isActive: createUserDto.isActive ?? true,
        });

        return this.usersRepository.save(user);
    }

    findAll() {
        return this.usersRepository.find({ relations: { role: true }, order: { createdAt: 'DESC' } });
    }

    async findOne(id: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findByEmailForAuth(email: string) {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('LOWER(user.email) = LOWER(:email)', { email })
            .getOne();
    }

    async markLogin(id: string) {
        await this.usersRepository.update(id, { lastLoginAt: new Date() });
    }

    async findDefaultOwnerForOrganization(organizationId: string) {
        const user = await this.usersRepository.findOne({
            where: { organizationId, isActive: true },
            order: { createdAt: 'ASC' },
        });
        if (!user) {
            throw new NotFoundException('No agent available for this organization');
        }
        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.findOne(id);
        const { password, ...rest } = updateUserDto;

        if (password) {
            user.passwordHash = await bcrypt.hash(password, 10);
        }

        Object.assign(user, rest);
        return this.usersRepository.save(user);
    }

    async remove(id: string) {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
        return { id };
    }
}
