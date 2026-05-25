import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    ValidateNested,
} from 'class-validator';

export class ChatMessageDto {
    @ApiProperty({ enum: ['user', 'assistant'] })
    @IsIn(['user', 'assistant'])
    role!: 'user' | 'assistant';

    @ApiProperty({ example: '¿Cuántas casas disponibles tengo?' })
    @IsString()
    @MaxLength(4000)
    content!: string;
}

export class ChatRequestDto {
    @ApiPropertyOptional({ description: 'ID de sesión server-side (v2). El cliente debe reutilizarlo.' })
    @IsOptional()
    @IsUUID()
    sessionId?: string;

    @ApiPropertyOptional({ description: 'Nuevo mensaje del usuario (modo v2 con sessionId)' })
    @IsOptional()
    @IsString()
    @MaxLength(4000)
    message?: string;

    @ApiPropertyOptional({ type: [ChatMessageDto], description: 'Historial legacy (fallback sin sesión server-side)' })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(30)
    @ValidateNested({ each: true })
    @Type(() => ChatMessageDto)
    messages?: ChatMessageDto[];
}
