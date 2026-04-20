import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;
}
