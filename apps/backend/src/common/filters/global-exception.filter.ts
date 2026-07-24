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

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';
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

    this.logger.error(`${request.method} ${request.url} — ${message}`);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
