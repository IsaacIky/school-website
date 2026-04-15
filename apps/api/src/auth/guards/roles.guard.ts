import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * RBAC guard placeholder.
 * Checks whether the authenticated user holds ANY of the required roles.
 * Full permission/scope checking to be wired in a later iteration.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.sub) return false;

    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId: user.sub },
      include: { role: true },
    });

    return assignments.some((a) => requiredRoles.includes(a.role.name));
  }
}
