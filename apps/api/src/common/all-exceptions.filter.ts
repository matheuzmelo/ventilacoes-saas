import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AppError,
  ERROR_CODES,
  type ErrorCode,
  type ErrorEnvelope,
} from '@vs/shared';
import {
  getCorrelationId,
  type RequestWithContext,
} from './request-context';

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: ERROR_CODES.VALIDATION_ERROR,
  401: ERROR_CODES.UNAUTHENTICATED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.BUSINESS_RULE_CONFLICT,
  429: ERROR_CODES.RATE_LIMITED,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();
    const correlationId = getCorrelationId(request);

    const { status, code, message, details } = this.normalize(
      exception,
      correlationId,
    );

    const body: ErrorEnvelope = {
      error: {
        code,
        message,
        correlationId,
        ...(details === undefined ? {} : { details }),
      },
    };

    response.status(status).json(body);
  }

  private normalize(
    exception: unknown,
    correlationId: string,
  ): {
    status: number;
    code: ErrorCode;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof AppError) {
      return {
        status: exception.status,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      let message = exception.message;
      let details: unknown;

      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const raw = (payload as { message?: unknown }).message;
        if (Array.isArray(raw)) {
          message = 'Dados inválidos';
          details = raw;
        } else if (typeof raw === 'string') {
          message = raw;
        }
      }

      return {
        status,
        code: STATUS_TO_CODE[status] ?? ERROR_CODES.INTERNAL_ERROR,
        message,
        details,
      };
    }

    this.logger.error(
      `Erro inesperado [${correlationId}]`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Erro interno',
    };
  }
}
