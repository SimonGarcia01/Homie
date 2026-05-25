import { ApiProperty } from '@nestjs/swagger';

import { PropertyType } from '../../../common/enums';

export class PublicPropertyLocationDto {
    @ApiProperty({ example: 'Colombia' })
    country!: string;

    @ApiProperty({ example: 'Cali' })
    city!: string;

    @ApiProperty({ example: 'Av. Roosevelt 23-45', required: false })
    address?: string;
}

export class PublicPropertyFeatureDto {
    @ApiProperty({ example: 2 })
    bedrooms!: number;

    @ApiProperty({ example: 1 })
    bathrooms!: number;

    @ApiProperty({ example: false })
    isFurnished!: boolean;

    @ApiProperty({ example: true })
    petsAllowed!: boolean;
}

export class PublicPropertyImageDto {
    @ApiProperty()
    id!: string;

    @ApiProperty({ example: 'https://example.com/image.jpg' })
    imageUrl!: string;

    @ApiProperty({ example: true })
    isCover!: boolean;
}

export class PublicPropertyRentalDetailDto {
    @ApiProperty({ example: 1500000 })
    monthlyRent!: number;

    @ApiProperty({ example: 'COP' })
    currency!: string;
}

export class PublicPropertyDto {
    @ApiProperty()
    id!: string;

    @ApiProperty({ example: 'HOM-001' })
    code!: string;

    @ApiProperty({ example: 'Apartamento norte' })
    title!: string;

    @ApiProperty({ example: 'Hermoso apartamento en el norte de la ciudad' })
    description?: string;

    @ApiProperty({ enum: PropertyType })
    propertyType!: PropertyType;

    @ApiProperty({ example: 'available' })
    commercialStatus!: string;

    @ApiProperty({ type: PublicPropertyLocationDto })
    location!: PublicPropertyLocationDto;

    @ApiProperty({ type: PublicPropertyFeatureDto })
    feature!: PublicPropertyFeatureDto;

    @ApiProperty({ type: PublicPropertyRentalDetailDto })
    rentalDetail!: PublicPropertyRentalDetailDto;

    @ApiProperty({ type: [PublicPropertyImageDto] })
    images!: PublicPropertyImageDto[];

    @ApiProperty({ example: 'https://example.com/cover.jpg' })
    coverImageUrl?: string;
}

export class PublicPropertyListResponseDto {
    @ApiProperty({ type: [PublicPropertyDto] })
    data!: PublicPropertyDto[];

    @ApiProperty({ example: 1 })
    page!: number;

    @ApiProperty({ example: 12 })
    limit!: number;

    @ApiProperty({ example: 50 })
    total!: number;

    @ApiProperty({ example: 5 })
    totalPages!: number;
}
