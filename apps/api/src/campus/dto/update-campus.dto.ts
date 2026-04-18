import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCampusDto } from './create-campus.dto';

export class UpdateCampusDto extends PartialType(CreateCampusDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
