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
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('departments')
export class DepartmentController {
  constructor(private readonly department: DepartmentService) {}

  @Roles('Super Admin', 'Faculty Admin', 'Department Admin')
  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.department.create(dto);
  }

  @Get()
  findAll(@Query('facultyId') facultyId?: string) {
    return this.department.findAll(facultyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.department.findOne(id);
  }

  @Roles('Super Admin', 'Faculty Admin', 'Department Admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.department.update(id, dto);
  }

  @Roles('Super Admin', 'Faculty Admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.department.remove(id);
  }
}
