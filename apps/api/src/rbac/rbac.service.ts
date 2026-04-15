import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    const scopeType: RoleScopeType = (dto.scopeType as RoleScopeType) ?? RoleScopeType.GLOBAL;

    // Validate that the correct scope ID is provided for scoped assignments,
    // and that GLOBAL assignments do not carry any scope IDs.
    this.validateScopeIds(scopeType, dto);

    // Prisma compound-unique key uses null to represent "no scope id"; use null
    // consistently so the upsert correctly finds existing records.
    const campusId = dto.campusId ?? null;
    const facultyId = dto.facultyId ?? null;
    const departmentId = dto.departmentId ?? null;
    const programId = dto.programId ?? null;

    return this.prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId_scopeType_campusId_facultyId_departmentId_programId: {
          userId: dto.userId,
          roleId: dto.roleId,
          scopeType,
          // Cast required because Prisma's generated type for nullable compound-unique
          // fields expects the database value, which can only be a string (or null via
          // the Prisma.StringNullableFilter helper). Passing the string directly is safe.
          campusId: campusId as string,
          facultyId: facultyId as string,
          departmentId: departmentId as string,
          programId: programId as string,
        },
      },
      update: { assignedBy },
      create: {
        userId: dto.userId,
        roleId: dto.roleId,
        scopeType,
        campusId,
        facultyId,
        departmentId,
        programId,
        assignedBy,
      },
    });
  }

  /**
   * Validates that scope IDs are consistent with the requested scopeType:
   * - GLOBAL: no scope IDs allowed.
   * - CAMPUS: campusId required; other scope IDs must be absent.
   * - FACULTY: facultyId required; other scope IDs must be absent.
   * - DEPARTMENT: departmentId required; other scope IDs must be absent.
   * - PROGRAM: programId required; other scope IDs must be absent.
   */
  private validateScopeIds(scopeType: RoleScopeType, dto: AssignRoleDto): void {
    const { campusId, facultyId, departmentId, programId } = dto;

    switch (scopeType) {
      case RoleScopeType.GLOBAL:
        if (campusId || facultyId || departmentId || programId) {
          throw new BadRequestException(
            'GLOBAL scope must not include campusId, facultyId, departmentId, or programId.',
          );
        }
        break;

      case RoleScopeType.CAMPUS:
        if (!campusId) {
          throw new BadRequestException('CAMPUS scope requires campusId.');
        }
        if (facultyId || departmentId || programId) {
          throw new BadRequestException(
            'CAMPUS scope must not include facultyId, departmentId, or programId.',
          );
        }
        break;

      case RoleScopeType.FACULTY:
        if (!facultyId) {
          throw new BadRequestException('FACULTY scope requires facultyId.');
        }
        if (campusId || departmentId || programId) {
          throw new BadRequestException(
            'FACULTY scope must not include campusId, departmentId, or programId.',
          );
        }
        break;

      case RoleScopeType.DEPARTMENT:
        if (!departmentId) {
          throw new BadRequestException('DEPARTMENT scope requires departmentId.');
        }
        if (campusId || facultyId || programId) {
          throw new BadRequestException(
            'DEPARTMENT scope must not include campusId, facultyId, or programId.',
          );
        }
        break;

      case RoleScopeType.PROGRAM:
        if (!programId) {
          throw new BadRequestException('PROGRAM scope requires programId.');
        }
        if (campusId || facultyId || departmentId) {
          throw new BadRequestException(
            'PROGRAM scope must not include campusId, facultyId, or departmentId.',
          );
        }
        break;

      default:
        throw new BadRequestException(`Unknown scopeType: ${scopeType}`);
    }
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
