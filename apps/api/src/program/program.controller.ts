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
import { ProgramService } from './program.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('programs')
export class ProgramController {
  constructor(private readonly program: ProgramService) {}

  @Roles('Super Admin', 'Faculty Admin', 'Department Admin')
  @Permissions('program:create')
  @Post()
  create(@Body() dto: CreateProgramDto) {
    return this.program.create(dto);
  }

  @Permissions('program:read')
  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    return this.program.findAll(departmentId);
  }

  @Permissions('program:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.program.findOne(id);
  }

  @Roles('Super Admin', 'Faculty Admin', 'Department Admin')
  @Permissions('program:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.program.update(id, dto);
  }

  @Roles('Super Admin', 'Faculty Admin')
  @Permissions('program:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.program.remove(id);
  }
}
