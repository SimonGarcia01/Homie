import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property } from './entities/property.entity';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private readonly repository: Repository<Property>,
    ) {}

    async create(createDto: CreatePropertyDto) {
        const entity = this.repository.create(createDto as Partial<Property>);
        return this.repository.save(entity);
    }

    async findAll() {
        const properties = await this.repository.find({ relations: { images: true } });
        return properties.map((property) => this.attachCover(property));
    }

    async findOne(id: string) {
        const entity = await this.repository.findOne({
            where: { id },
            relations: { images: true },
        });
        if (!entity) throw new NotFoundException('Property not found');
        return this.attachCover(entity);
    }

    async update(id: string, updateDto: UpdatePropertyDto) {
        const entity = await this.findOne(id);
        Object.assign(entity, updateDto);
        return this.repository.save(entity);
    }

    async remove(id: string) {
        const entity = await this.findOne(id);
        await this.repository.remove(entity);
        return { id };
    }

    private attachCover(property: Property): Property & { coverImageUrl: string | null } {
        const cover = property.images?.find((image) => image.isCover) ?? property.images?.[0] ?? null;
        return Object.assign(property, { coverImageUrl: cover?.imageUrl ?? null });
    }
}
