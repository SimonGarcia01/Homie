import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PropertyRentalDetail } from './entities/property-rental-detail.entity';
import { PropertyLocation } from './entities/property-location.entity';
import { PropertyImage } from './entities/property-image.entity';
import { PropertyFeature } from './entities/property-feature.entity';
import { PropertyExpense } from './entities/property-expense.entity';
import { PropertyIncome } from './entities/property-income.entity';
import { PropertyAmenity } from './entities/property-amenity.entity';
import { PropertyAgent } from './entities/property-agent.entity';
import { Property } from './entities/property.entity';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyImagesController } from './property-images.controller';
import { PropertyImagesService } from './property-images.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Property,
            PropertyLocation,
            PropertyRentalDetail,
            PropertyFeature,
            PropertyIncome,
            PropertyExpense,
            PropertyAmenity,
            PropertyImage,
            PropertyAgent,
        ]),
    ],
    controllers: [PropertiesController, PropertyImagesController],
    providers: [PropertiesService, PropertyImagesService],
    exports: [PropertiesService, PropertyImagesService],
})
export class PropertiesModule {}
