import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'Camila' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;

    @ApiProperty({ example: 'Rivas' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;

    @ApiProperty({ example: 'camila@broker.cl' })
    @IsEmail()
    email!: string;

    @ApiProperty({ minLength: 8 })
    @IsString()
    @MinLength(8)
    password!: string;

    @ApiProperty({ example: 'Homie Brokers', description: 'Nombre de tu equipo o corretaje' })
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    organizationName!: string;

    @ApiPropertyOptional({ example: 'Chile', default: 'Chile' })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    country?: string;
}
