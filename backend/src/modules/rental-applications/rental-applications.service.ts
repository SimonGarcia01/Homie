import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RentalApplicationStatus } from '../../common/enums';

import { RentalApplication } from './entities/rental-application.entity';

@Injectable()
export class RentalApplicationsService {
    constructor(
        @InjectRepository(RentalApplication)
        private readonly repository: Repository<RentalApplication>,
    ) {}

    async findPending() {
        return this.repository.find({
            where: { status: RentalApplicationStatus.PENDING_DOCUMENTS },
            order: { createdAt: 'DESC' },
        });
    }

    async countPending() {
        const count = await this.repository.count({
            where: { status: RentalApplicationStatus.PENDING_DOCUMENTS },
        });
        return { count };
    }

    async create(dto: { opportunityId: string; propertyId: string }) {
        const app = await this.repository.save(
            this.repository.create({
                opportunityId: dto.opportunityId,
                propertyId: dto.propertyId,
                status: RentalApplicationStatus.PENDING_DOCUMENTS,
            }),
        );
        return app;
    }

    async findOne(id: string) {
        const app = await this.repository.findOne({ where: { id } });
        if (!app) throw new NotFoundException('Application not found');
        return app;
    }
}
