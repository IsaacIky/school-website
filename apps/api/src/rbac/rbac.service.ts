import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  AssignRoleDto,
  AssignPermissionsDto,
} from './dto/rbac.dto';
import { RoleScopeType } from '@prisma/client';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Roles ──────────────────────────────────────────────────────────────
  createRole(dto: CreateRoleDto) {
    return this.prisma.role.create({ data: dto });
  }

  findAllRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async findOneRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.findOneRole(id);
    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('Cannot rename a system role');
    }
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async deleteRole(id: string) {
    const role = await this.findOneRole(id);
    if (role.isSystem) throw new BadRequestException('Cannot delete a system role');
    return this.prisma.role.delete({ where: { id } });
  }

  async assignPermissionsToRole(roleId: string, dto: AssignPermissionsDto) {
    await this.findOneRole(roleId);
    const upserts = dto.permissionIds.map((permissionId) =>
      this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      }),
    );
    return Promise.all(upserts);
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  }

  // ── Permissions ──────────────────────────────────────────────────────────
  createPermission(dto: CreatePermissionDto) {
    return this.prisma.permission.create({ data: dto });
  }

  findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  }

  async deletePermission(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException(`Permission ${id} not found`);
    return this.prisma.permission.delete({ where: { id } });
  }

  // ── User Role Assignments ─────────────────────────────────────────────────
  async assignRoleToUser(dto: AssignRoleDto, assignedBy?: string) {
    const scopeType = (dto.scopeType as RoleScopeType) ?? RoleScopeType.GLOBAL;
    return this.prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId_scopeType_campusId_facultyId_departmentId_programId: {
          userId: dto.userId,
          roleId: dto.roleId,
          scopeType,
          campusId: dto.campusId ?? null,
          facultyId: dto.facultyId ?? null,
          departmentId: dto.departmentId ?? null,
          programId: dto.programId ?? null,
        },
      },
      update: { assignedBy },
      create: {
        userId: dto.userId,
        roleId: dto.roleId,
        scopeType,
        campusId: dto.campusId,
        facultyId: dto.facultyId,
        departmentId: dto.departmentId,
        programId: dto.programId,
        assignedBy,
      },
    });
  }

  getUserRoles(userId: string) {
    return this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: {
        role: { include: { rolePermissions: { include: { permission: true } } } },
        campus: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });
  }

  async revokeRoleFromUser(assignmentId: string) {
    const assignment = await this.prisma.userRoleAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException(`Assignment ${assignmentId} not found`);
    return this.prisma.userRoleAssignment.delete({ where: { id: assignmentId } });
  }
}
