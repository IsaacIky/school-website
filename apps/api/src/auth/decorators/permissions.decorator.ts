import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to restrict a route to users who hold ANY of the listed permissions.
 * Permissions follow the `resource:action` naming convention, e.g.:
 *   @Permissions('campus:create', 'campus:update')
 *
 * The PermissionsGuard evaluates this list and allows access when the authenticated
 * user has at least one matching permission (taking scope into account).
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
