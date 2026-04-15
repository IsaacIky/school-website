import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Audit interceptor: automatically logs mutating admin API calls to audit_logs.
 * Attach at controller or globally as needed.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = req;

    if (!MUTATING_METHODS.has(method)) return next.handle();

    const entity = this.extractEntity(url);
    const before = method !== 'POST' ? req.body : undefined;

    return next.handle().pipe(
      tap((result) => {
        this.audit
          .log({
            userId: user?.sub,
            action: method,
            entity,
            entityId: result?.id,
            before,
            after: result,
            ipAddress: ip,
            userAgent: headers['user-agent'],
          })
          .catch((err) => console.error('[AuditInterceptor] Failed to write audit log:', err));
      }),
    );
  }

  private extractEntity(url: string): string {
    // Extract first meaningful path segment after /api/v1/
    const match = url.match(/\/api\/v1\/([^/?]+)/);
    return match ? match[1] : 'unknown';
  }
}
