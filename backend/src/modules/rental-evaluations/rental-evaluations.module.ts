import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RentalApplication } from '../rental-applications/entities/rental-application.entity';

import { RentalEvaluation } from './entities/rental-evaluation.entity';
import { RentalEvaluationsController } from './rental-evaluations.controller';
import { RentalEvaluationsService } from './rental-evaluations.service';

@Module({
    imports: [TypeOrmModule.forFeature([RentalEvaluation, RentalApplication])],
    controllers: [RentalEvaluationsController],
    providers: [RentalEvaluationsService],
    exports: [RentalEvaluationsService],
})
export class RentalEvaluationsModule {}
