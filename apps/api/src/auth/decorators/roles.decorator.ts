import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict a route to users with at least one of the specified roles.
 *
 * Usage:
 *   @Roles('Super Admin', 'Faculty Admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
