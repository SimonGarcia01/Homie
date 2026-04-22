import { Module } from '@nestjs/common';
import { SearchPreference } from './entities/search-preference.entity';
import { PreferenceZone } from './entities/preference-zone.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lead } from './entities/lead.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, SearchPreference, PreferenceZone])],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
