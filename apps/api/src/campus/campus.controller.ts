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
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('campuses')
export class CampusController {
  constructor(private readonly campus: CampusService) {}

  @Roles('Super Admin')
  @Permissions('campus:create')
  @Post()
  create(@Body() dto: CreateCampusDto) {
    return this.campus.create(dto);
  }

  @Permissions('campus:read')
  @Get()
  findAll() {
    return this.campus.findAll();
  }

  @Permissions('campus:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campus.findOne(id);
  }

  @Roles('Super Admin')
  @Permissions('campus:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampusDto) {
    return this.campus.update(id, dto);
  }

  @Roles('Super Admin')
  @Permissions('campus:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campus.remove(id);
  }
}
