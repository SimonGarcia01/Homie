import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly repository: Repository<Role>,
    ) {}

    findAll() {
        return this.repository.find({ order: { name: 'ASC' } });
    }

    async findByName(name: string) {
        return this.repository.findOne({ where: { name: name as Role['name'] } });
    }
}
