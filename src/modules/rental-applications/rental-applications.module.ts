import { Module } from '@nestjs/common';
import { ApplicationApplicant } from './entities/application-applicant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RentalApplication } from './entities/rental-application.entity';
import { RentalApplicationsController } from './rental-applications.controller';
import { RentalApplicationsService } from './rental-applications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RentalApplication, ApplicationApplicant]),
  ],
  controllers: [RentalApplicationsController],
  providers: [RentalApplicationsService],
  exports: [RentalApplicationsService],
})
export class RentalApplicationsModule {}
