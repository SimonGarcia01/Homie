import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/auth/roles.decorator';
import { UserRoleName } from '../../common/enums';

import { PropertyImagesService } from './property-images.service';
import { MAX_IMAGES_PER_REQUEST } from './property-images.constants';

type IncomingFile = {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};

type RequestWithOrg = { user: { id: string; organizationId: string } };

@ApiTags('property-images')
@ApiBearerAuth()
@Controller('properties/:propertyId/images')
export class PropertyImagesController {
    constructor(private readonly service: PropertyImagesService) {}

    @Get()
    @ApiOperation({ summary: 'List all images for a property' })
    list(@Param('propertyId', new ParseUUIDPipe()) propertyId: string, @Req() req: RequestWithOrg) {
        return this.service.listForProperty(propertyId, req.user.organizationId);
    }

    @Post()
    @Roles(UserRoleName.ADMIN, UserRoleName.AGENT, UserRoleName.COORDINATOR)
    // Per-file size validation runs in the service so a single oversized file
    // doesn't reject the whole batch (HU-02 CA3).
    @UseInterceptors(FilesInterceptor('files', MAX_IMAGES_PER_REQUEST))
    @ApiOperation({
        summary: 'Upload one or more images for a property. Per-file validation; invalid files do not block the rest.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    upload(
        @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
        @UploadedFiles() files: IncomingFile[],
        @Req() req: RequestWithOrg,
    ) {
        return this.service.upload(propertyId, req.user.organizationId, req.user.id, files);
    }

    @Delete(':imageId')
    @Roles(UserRoleName.ADMIN, UserRoleName.AGENT, UserRoleName.COORDINATOR)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete an individual image' })
    remove(
        @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
        @Param('imageId', new ParseUUIDPipe()) imageId: string,
        @Req() req: RequestWithOrg,
    ) {
        return this.service.remove(propertyId, req.user.organizationId, imageId);
    }

    @Patch(':imageId/cover')
    @Roles(UserRoleName.ADMIN, UserRoleName.AGENT, UserRoleName.COORDINATOR)
    @ApiOperation({ summary: 'Set an image as the cover/principal image of the property' })
    setCover(
        @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
        @Param('imageId', new ParseUUIDPipe()) imageId: string,
        @Req() req: RequestWithOrg,
    ) {
        return this.service.setCover(propertyId, req.user.organizationId, imageId);
    }
}
