import { Module } from '@nestjs/common';
import { PropertyRentalDetail } from './entities/property-rental-detail.entity';
import { PropertyLocation } from './entities/property-location.entity';
import { PropertyImage } from './entities/property-image.entity';
import { PropertyFeature } from './entities/property-feature.entity';
import { PropertyAmenity } from './entities/property-amenity.entity';
import { PropertyAgent } from './entities/property-agent.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Property } from './entities/property.entity';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      PropertyLocation,
      PropertyRentalDetail,
      PropertyFeature,
      PropertyAmenity,
      PropertyImage,
      PropertyAgent,
    ]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
