import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@vs/shared';
import type { RequestWithContext } from './request-context';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.user as AuthUser;
  },
);
