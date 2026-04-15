import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CampusService } from './campus.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('campuses')
export class CampusController {
  constructor(private readonly campus: CampusService) {}

  @Roles('Super Admin')
  @Post()
  create(@Body() dto: CreateCampusDto) {
    return this.campus.create(dto);
  }

  @Get()
  findAll() {
    return this.campus.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campus.findOne(id);
  }

  @Roles('Super Admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampusDto) {
    return this.campus.update(id, dto);
  }

  @Roles('Super Admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campus.remove(id);
  }
}
