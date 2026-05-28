import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProspectInquiry } from './entities/prospect-inquiry.entity';
import { ProspectInquirySyncService } from './prospect-inquiry-sync.service';

@Module({
    imports: [TypeOrmModule.forFeature([ProspectInquiry])],
    providers: [ProspectInquirySyncService],
    exports: [ProspectInquirySyncService],
})
export class ProspectInquirySyncModule {}
