import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Permission-based guard with scope enforcement.
 *
 * Resolution order for a required permission `resource:action`:
 * 1. User has a GLOBAL role assignment that includes the permission → allow.
 * 2. For scoped resources, the user holds a role with the permission whose
 *    scope assignment covers the target entity:
 *
 *    campus    → CAMPUS scopeType matches req.params.id (campusId)
 *    faculty   → FACULTY matches req.params.id OR CAMPUS matches faculty.campusId
 *    department→ DEPARTMENT matches req.params.id OR FACULTY matches dept.facultyId
 *               OR CAMPUS matches dept.faculty.campusId
 *    program   → PROGRAM matches req.params.id OR DEPARTMENT matches prog.departmentId
 *               OR FACULTY matches prog.department.facultyId
 *               OR CAMPUS matches prog.department.faculty.campusId
 *
 * If no permissions are declared on the handler/controller, the guard allows access
 * (i.e. other guards such as JwtAuthGuard and RolesGuard remain responsible).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.sub) return false;

    // Load all role assignments for this user, including permissions on each role
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId: user.sub },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });

    const resourceId: string | undefined = request.params?.id;

    for (const requiredPerm of requiredPermissions) {
      const [resource] = requiredPerm.split(':');

      for (const assignment of assignments) {
        const hasPermission = assignment.role.rolePermissions.some(
          (rp) => rp.permission.name === requiredPerm,
        );
        if (!hasPermission) continue;

        // GLOBAL scope → always allow
        if (assignment.scopeType === 'GLOBAL') return true;

        // No resource id in the request → can't evaluate scope; deny
        if (!resourceId) continue;

        const allowed = await this.checkScope(assignment, resource, resourceId);
        if (allowed) return true;
      }
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  // ── Scope resolution helpers ──────────────────────────────────────────

  private async checkScope(
    assignment: { scopeType: string; campusId: string | null; facultyId: string | null; departmentId: string | null; programId: string | null },
    resource: string,
    entityId: string,
  ): Promise<boolean> {
    switch (resource) {
      case 'campus':
        return this.checkCampusScope(assignment, entityId);
      case 'faculty':
        return this.checkFacultyScope(assignment, entityId);
      case 'department':
        return this.checkDepartmentScope(assignment, entityId);
      case 'program':
        return this.checkProgramScope(assignment, entityId);
      default:
        // For unknown resources, GLOBAL was already handled; deny scoped
        return false;
    }
  }

  private checkCampusScope(
    assignment: { scopeType: string; campusId: string | null },
    campusId: string,
  ): boolean {
    return assignment.scopeType === 'CAMPUS' && assignment.campusId === campusId;
  }

  private async checkFacultyScope(
    assignment: { scopeType: string; facultyId: string | null; campusId: string | null },
    facultyId: string,
  ): Promise<boolean> {
    if (assignment.scopeType === 'FACULTY' && assignment.facultyId === facultyId) return true;

    if (assignment.scopeType === 'CAMPUS' && assignment.campusId) {
      const faculty = await this.prisma.faculty.findUnique({ where: { id: facultyId } });
      return faculty?.campusId === assignment.campusId;
    }

    return false;
  }

  private async checkDepartmentScope(
    assignment: { scopeType: string; departmentId: string | null; facultyId: string | null; campusId: string | null },
    departmentId: string,
  ): Promise<boolean> {
    if (assignment.scopeType === 'DEPARTMENT' && assignment.departmentId === departmentId) return true;

    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: { faculty: { select: { id: true, campusId: true } } },
    });
    if (!dept) return false;

    if (assignment.scopeType === 'FACULTY' && assignment.facultyId === dept.facultyId) return true;
    if (assignment.scopeType === 'CAMPUS' && assignment.campusId === dept.faculty.campusId) return true;

    return false;
  }

  private async checkProgramScope(
    assignment: { scopeType: string; programId: string | null; departmentId: string | null; facultyId: string | null; campusId: string | null },
    programId: string,
  ): Promise<boolean> {
    if (assignment.scopeType === 'PROGRAM' && assignment.programId === programId) return true;

    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      include: {
        department: {
          include: { faculty: { select: { id: true, campusId: true } } },
        },
      },
    });
    if (!program || !program.department || !program.department.faculty) return false;

    if (assignment.scopeType === 'DEPARTMENT' && assignment.departmentId === program.departmentId) return true;
    if (assignment.scopeType === 'FACULTY' && assignment.facultyId === program.department.facultyId) return true;
    if (assignment.scopeType === 'CAMPUS' && assignment.campusId === program.department.faculty.campusId) return true;

    return false;
  }
}
