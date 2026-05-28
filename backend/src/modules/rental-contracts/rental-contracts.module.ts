import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationApplicant } from '../rental-applications/entities/application-applicant.entity';
import { RentalApplication } from '../rental-applications/entities/rental-application.entity';
import { PropertyIncome } from '../properties/entities/property-income.entity';
import { Property } from '../properties/entities/property.entity';

import { RentalContract } from './entities/rental-contract.entity';
import { RentalContractsController } from './rental-contracts.controller';
import { RentalContractsService } from './rental-contracts.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RentalContract,
            RentalApplication,
            ApplicationApplicant,
            Property,
            PropertyIncome,
        ]),
    ],
    controllers: [RentalContractsController],
    providers: [RentalContractsService],
    exports: [RentalContractsService],
})
export class RentalContractsModule {}
