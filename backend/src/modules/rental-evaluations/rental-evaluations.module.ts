import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RentalEvaluation } from './entities/rental-evaluation.entity';
import { RentalEvaluationsController } from './rental-evaluations.controller';
import { RentalEvaluationsService } from './rental-evaluations.service';

@Module({
    imports: [TypeOrmModule.forFeature([RentalEvaluation])],
    controllers: [RentalEvaluationsController],
    providers: [RentalEvaluationsService],
    exports: [RentalEvaluationsService],
})
export class RentalEvaluationsModule {}
