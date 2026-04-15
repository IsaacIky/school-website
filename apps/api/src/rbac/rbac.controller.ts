import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import {
  AssignPermissionsDto,
  AssignRoleDto,
  CreatePermissionDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './dto/rbac.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Super Admin')
@UseInterceptors(AuditInterceptor)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  // ── Roles ──────────────────────────────────────────────────────────────
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbac.createRole(dto);
  }

  @Get('roles')
  findAllRoles() {
    return this.rbac.findAllRoles();
  }

  @Get('roles/:id')
  findOneRole(@Param('id') id: string) {
    return this.rbac.findOneRole(id);
  }

  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rbac.updateRole(id, dto);
  }

  @Delete('roles/:id')
  deleteRole(@Param('id') id: string) {
    return this.rbac.deleteRole(id);
  }

  @Post('roles/:id/permissions')
  assignPermissionsToRole(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    return this.rbac.assignPermissionsToRole(id, dto);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbac.removePermissionFromRole(roleId, permissionId);
  }

  // ── Permissions ─────────────────────────────────────────────────────────
  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.rbac.createPermission(dto);
  }

  @Get('permissions')
  findAllPermissions() {
    return this.rbac.findAllPermissions();
  }

  @Delete('permissions/:id')
  deletePermission(@Param('id') id: string) {
    return this.rbac.deletePermission(id);
  }

  // ── User Role Assignments ────────────────────────────────────────────────
  @Post('assign')
  assignRole(@Body() dto: AssignRoleDto, @Request() req) {
    return this.rbac.assignRoleToUser(dto, req.user?.sub);
  }

  @Get('users/:userId/roles')
  getUserRoles(@Param('userId') userId: string) {
    return this.rbac.getUserRoles(userId);
  }

  @Delete('assignments/:id')
  revokeRole(@Param('id') id: string) {
    return this.rbac.revokeRoleFromUser(id);
  }
}
