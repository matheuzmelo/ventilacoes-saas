import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '@vs/shared';

export interface RequestWithContext extends Request {
  correlationId?: string;
  user?: AuthUser;
}

const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export function correlationIdMiddleware(
  req: RequestWithContext,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header('x-correlation-id');
  const correlationId =
    incoming && CORRELATION_ID_PATTERN.test(incoming)
      ? incoming
      : randomUUID();

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}

export function getCorrelationId(req: Request & { correlationId?: string }): string {
  return req.correlationId ?? 'unknown';
}
