import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('faculties')
export class FacultyController {
  constructor(private readonly faculty: FacultyService) {}

  @Roles('Super Admin', 'Faculty Admin')
  @Post()
  create(@Body() dto: CreateFacultyDto) {
    return this.faculty.create(dto);
  }

  @Get()
  findAll(@Query('campusId') campusId?: string) {
    return this.faculty.findAll(campusId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.faculty.findOne(id);
  }

  @Roles('Super Admin', 'Faculty Admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.faculty.update(id, dto);
  }

  @Roles('Super Admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.faculty.remove(id);
  }
}
