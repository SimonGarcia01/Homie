import { Module } from '@nestjs/common';
import { AgentAvailability } from './entities/agent-availability.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Visit } from './entities/visit.entity';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Visit, AgentAvailability])],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
