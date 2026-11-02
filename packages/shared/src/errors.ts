export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BUSINESS_RULE_CONFLICT: 'BUSINESS_RULE_CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    correlationId: string;
    details?: unknown;
  };
}

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errors = {
  validation: (message = 'Dados inválidos', details?: unknown) =>
    new AppError(ERROR_CODES.VALIDATION_ERROR, message, 400, details),
  unauthenticated: (message = 'Sessão inválida ou expirada') =>
    new AppError(ERROR_CODES.UNAUTHENTICATED, message, 401),
  forbidden: (message = 'Sem permissão para esta ação') =>
    new AppError(ERROR_CODES.FORBIDDEN, message, 403),
  notFound: (message = 'Recurso não encontrado') =>
    new AppError(ERROR_CODES.NOT_FOUND, message, 404),
  conflict: (message = 'Conflito de regra de negócio', details?: unknown) =>
    new AppError(ERROR_CODES.BUSINESS_RULE_CONFLICT, message, 409, details),
  rateLimited: (message = 'Muitas requisições') =>
    new AppError(ERROR_CODES.RATE_LIMITED, message, 429),
  internal: (message = 'Erro interno') =>
    new AppError(ERROR_CODES.INTERNAL_ERROR, message, 500),
};
