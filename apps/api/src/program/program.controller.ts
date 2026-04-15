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
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('programs')
export class ProgramController {
  constructor(private readonly program: ProgramService) {}

  @Roles('Super Admin', 'Faculty Admin', 'Department Admin')
  @Post()
  create(@Body() dto: CreateProgramDto) {
    return this.program.create(dto);
  }

  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    return this.program.findAll(departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.program.findOne(id);
  }

  @Roles('Super Admin', 'Faculty Admin', 'Department Admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.program.update(id, dto);
  }

  @Roles('Super Admin', 'Faculty Admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.program.remove(id);
  }
}
