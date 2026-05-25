import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Amenity } from './entities/amenity.entity';

@Injectable()
export class AmenitiesService {
    constructor(
        @InjectRepository(Amenity)
        private readonly repository: Repository<Amenity>,
    ) {}

    findAll() {
        return this.repository.find({ order: { name: 'ASC' } });
    }
}
