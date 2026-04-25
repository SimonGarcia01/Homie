import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentType } from './entities/document-type.entity';
import { ApplicationChecklistItem } from './entities/application-checklist-item.entity';
import { DocumentRecord } from './entities/document.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
    imports: [TypeOrmModule.forFeature([DocumentRecord, DocumentType, ApplicationChecklistItem])],
    controllers: [DocumentsController],
    providers: [DocumentsService],
    exports: [DocumentsService],
})
export class DocumentsModule {}
