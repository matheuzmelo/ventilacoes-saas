import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  errors,
  type AccessTokenPayload,
  type AuthUser,
} from '@vs/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request): string | null => {
          const cookies = request.cookies as
            | Record<string, string>
            | undefined;
          return cookies?.vs_access ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: AccessTokenPayload): AuthUser {
    if (payload.type !== 'access' || !payload.tid || !payload.mid) {
      throw errors.unauthenticated();
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      membershipId: payload.mid,
      tenantId: payload.tid,
      tenantSlug: payload.tslug,
      role: payload.role,
      permissions: payload.permissions,
    };
  }
}
