import { IsString, IsOptional, IsInt, IsEnum, MaxLength, Min, Max } from 'class-validator';
import { ProgramLevel } from '@prisma/client';

export class CreateProgramDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  durationYears?: number;

  @IsOptional()
  @IsEnum(ProgramLevel)
  level?: ProgramLevel;

  @IsString()
  departmentId: string;
}
