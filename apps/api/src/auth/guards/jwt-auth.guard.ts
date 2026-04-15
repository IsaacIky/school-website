import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT authentication guard.
 * Attach to any route that requires an authenticated user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
