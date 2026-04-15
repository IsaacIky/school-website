import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Audit interceptor: automatically logs mutating admin API calls to audit_logs.
 *
 * NOTE: For UPDATE/PATCH operations the `before` field contains the incoming
 * request body (i.e. the fields being changed), NOT the full previous database
 * record. Capturing the true "before" snapshot requires a DB fetch before the
 * handler executes; this enhancement can be added per-service as needed.
 *
 * Attach at controller or globally as needed.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

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
          .catch((err) => {
            // Log audit failures so they surface in monitoring — do not swallow them silently.
            this.logger.error(`Failed to write audit log for ${method} ${url}: ${err.message}`, err.stack);
          });
      }),
    );
  }

  private extractEntity(url: string): string {
    // Extract first meaningful path segment after /api/v1/
    const match = url.match(/\/api\/v1\/([^/?]+)/);
    return match ? match[1] : 'unknown';
  }
}
