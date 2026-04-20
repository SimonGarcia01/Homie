import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Amenity } from './entities/amenity.entity';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesService } from './amenities.service';

@Module({
  imports: [TypeOrmModule.forFeature([Amenity])],
  controllers: [AmenitiesController],
  providers: [AmenitiesService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}
