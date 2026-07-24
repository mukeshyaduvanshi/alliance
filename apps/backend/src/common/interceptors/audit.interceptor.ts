import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';
import { AuditAction, ActorType } from '@database/database';

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    // Only log writes, and only if some form of auth resolved a user/brand/vendor
    const action = METHOD_TO_ACTION[method];
    if (!action || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const actorType: ActorType = user.brandId
          ? 'BRAND'
          : user.vendorId
            ? 'VENDOR'
            : 'INTERNAL_USER';
        const actorId = user.brandId ?? user.vendorId ?? user.userId;

        const moduleName = url.split('/').filter(Boolean)[2] ?? 'unknown'; // e.g. /api/v1/users -> "users"

        this.auditLogService.log({
          tenantId: user.tenantId,
          actorType,
          actorId,
          action,
          module: moduleName,
          ipAddress: ip,
          userAgent: headers['user-agent'],
          metadata: { url, method },
        });
      }),
    );
  }
}
