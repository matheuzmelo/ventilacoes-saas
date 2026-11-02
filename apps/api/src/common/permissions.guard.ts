import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  errors,
  hasPermission,
  type AuthUser,
  type Permission,
} from '@vs/shared';
import { PERMISSIONS_KEY } from './permissions.decorator';
import type { RequestWithContext } from './request-context';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw errors.unauthenticated();
    }

    if (!hasPermission(user.permissions, required)) {
      throw errors.forbidden();
    }

    return true;
  }
}
