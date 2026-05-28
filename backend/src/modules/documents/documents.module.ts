import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RentalApplication } from '../rental-applications/entities/rental-application.entity';
import { RentalApplicationsModule } from '../rental-applications/rental-applications.module';

import { ApplicationChecklistService } from './application-checklist.service';
import { DocumentType } from './entities/document-type.entity';
import { ApplicationChecklistItem } from './entities/application-checklist-item.entity';
import { DocumentRecord } from './entities/document.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([DocumentRecord, DocumentType, ApplicationChecklistItem, RentalApplication]),
        forwardRef(() => RentalApplicationsModule),
    ],
    controllers: [DocumentsController],
    providers: [DocumentsService, ApplicationChecklistService],
    exports: [DocumentsService, ApplicationChecklistService],
})
export class DocumentsModule {}
