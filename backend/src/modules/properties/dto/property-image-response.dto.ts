import { ApiProperty } from '@nestjs/swagger';

export class PropertyImageResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    propertyId!: string;

    @ApiProperty()
    url!: string;

    @ApiProperty()
    storageKey!: string;

    @ApiProperty()
    mimeType!: string;

    @ApiProperty()
    sizeBytes!: number;

    @ApiProperty()
    originalFilename!: string;

    @ApiProperty()
    isCover!: boolean;

    @ApiProperty()
    sortOrder!: number;

    @ApiProperty()
    createdAt!: string;
}

export class RejectedImageDto {
    @ApiProperty()
    filename!: string;

    @ApiProperty()
    reason!: string;
}

export class UploadPropertyImagesResponseDto {
    @ApiProperty({ type: [PropertyImageResponseDto] })
    uploaded!: PropertyImageResponseDto[];

    @ApiProperty({ type: [RejectedImageDto] })
    rejected!: RejectedImageDto[];
}
