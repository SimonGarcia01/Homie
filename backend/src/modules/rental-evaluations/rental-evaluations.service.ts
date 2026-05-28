import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EvaluationRecommendation, RentalApplicationStatus } from '../../common/enums';
import { RentalApplication } from '../rental-applications/entities/rental-application.entity';

import { CreateRentalEvaluationDto } from './dto/create-rental-evaluation.dto';
import { RentalEvaluation } from './entities/rental-evaluation.entity';

export type EvaluationView = {
    id: string;
    recommendation: EvaluationRecommendation;
    notes?: string;
    createdAt: string;
    evaluatedByUserId: string;
};

@Injectable()
export class RentalEvaluationsService {
    constructor(
        @InjectRepository(RentalEvaluation)
        private readonly evaluationsRepo: Repository<RentalEvaluation>,
        @InjectRepository(RentalApplication)
        private readonly applicationsRepo: Repository<RentalApplication>,
    ) {}

    private toView(evaluation: RentalEvaluation): EvaluationView {
        return {
            id: evaluation.id,
            recommendation: evaluation.recommendation,
            notes: evaluation.notes,
            createdAt: evaluation.createdAt.toISOString(),
            evaluatedByUserId: evaluation.evaluatedByUserId,
        };
    }

    async findByApplication(applicationId: string): Promise<EvaluationView | null> {
        const evaluation = await this.evaluationsRepo.findOne({
            where: { rentalApplicationId: applicationId },
            order: { createdAt: 'DESC' },
        });
        return evaluation ? this.toView(evaluation) : null;
    }

    async create(applicationId: string, userId: string, dto: CreateRentalEvaluationDto): Promise<EvaluationView> {
        const application = await this.applicationsRepo.findOne({ where: { id: applicationId } });
        if (!application) throw new NotFoundException('Application not found');

        const existing = await this.evaluationsRepo.findOne({ where: { rentalApplicationId: applicationId } });
        if (existing) throw new ConflictException('Evaluation already exists for this application');

        const evaluation = await this.evaluationsRepo.save(
            this.evaluationsRepo.create({
                rentalApplicationId: applicationId,
                evaluatedByUserId: userId,
                recommendation: dto.recommendation,
                notes: dto.notes?.trim() || undefined,
            }),
        );

        if (
            dto.recommendation === EvaluationRecommendation.APPROVED ||
            dto.recommendation === EvaluationRecommendation.APPROVED_WITH_CONDITIONS
        ) {
            application.status = RentalApplicationStatus.APPROVED;
        } else {
            application.status = RentalApplicationStatus.REJECTED;
        }
        await this.applicationsRepo.save(application);

        return this.toView(evaluation);
    }
}
