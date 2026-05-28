import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationChecklistItem } from '../documents/entities/application-checklist-item.entity';
import { DocumentsModule } from '../documents/documents.module';
import { Lead } from '../leads/entities/lead.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { Property } from '../properties/entities/property.entity';
import { RentalContractsModule } from '../rental-contracts/rental-contracts.module';
import { RentalEvaluationsModule } from '../rental-evaluations/rental-evaluations.module';

import { ApplicationApplicant } from './entities/application-applicant.entity';
import { RentalApplication } from './entities/rental-application.entity';
import { RentalApplicationsController } from './rental-applications.controller';
import { RentalApplicationsService } from './rental-applications.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([RentalApplication, ApplicationApplicant, ApplicationChecklistItem, Property, Opportunity, Lead]),
        RentalEvaluationsModule,
        RentalContractsModule,
        forwardRef(() => DocumentsModule),
    ],
    controllers: [RentalApplicationsController],
    providers: [RentalApplicationsService],
    exports: [RentalApplicationsService],
})
export class RentalApplicationsModule {}
