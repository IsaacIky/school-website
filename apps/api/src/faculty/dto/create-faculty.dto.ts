import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateFacultyDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  campusId: string;
}
