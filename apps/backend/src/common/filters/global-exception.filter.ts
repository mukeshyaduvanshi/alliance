import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Handle Prisma known request errors (P2002, P2003, etc.)
    const prismaCode = (exception as any)?.code;
    if (prismaCode === 'P2002') {
      status = HttpStatus.CONFLICT;
      const target = (exception as any)?.meta?.target;
      message = target
        ? `A record with this ${Array.isArray(target) ? target.join(', ') : target} already exists.`
        : 'A record with this unique identifier already exists.';
    } else if (prismaCode === 'P2003') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid reference: related record not found.';
    }

    const stack = exception instanceof Error ? exception.stack : undefined;

    // Only log server errors (5xx) — not routine 400/401/403/404 validation failures
    if (status >= 500) {
      try {
        await this.prisma.errorLog.create({
          data: {
            level: 'ERROR',
            message,
            stackTrace: stack,
            path: request.url,
            method: request.method,
            userId: (request as any).user?.userId,
          },
        });
      } catch (dbError) {
        this.logger.error('Failed to persist error log', dbError);
      }
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} — ${message}`);
    } else {
      this.logger.warn(`${request.method} ${request.url} — ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
