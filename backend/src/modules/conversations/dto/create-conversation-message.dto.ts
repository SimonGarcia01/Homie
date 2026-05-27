import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import { MessageChannel, MessageDirection } from '../../../common/enums';

export class CreateConversationMessageDto {
    @ApiProperty({ enum: MessageChannel })
    @IsEnum(MessageChannel)
    channel!: MessageChannel;

    @ApiProperty({ enum: MessageDirection })
    @IsEnum(MessageDirection)
    direction!: MessageDirection;

    @ApiProperty()
    @IsString()
    @MinLength(1)
    @MaxLength(8000)
    body!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    opportunityId?: string;
}
