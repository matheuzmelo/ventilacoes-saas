import { createHmac, randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { verify } from '@node-rs/argon2';
import { TenantPrisma } from '@vs/db';
import {
  ALL_PERMISSIONS,
  errors,
  permissionsForRole,
  type AccessTokenPayload,
  type AuthUser,
  type MembershipRole,
  type Permission,
} from '@vs/shared';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  accessExpiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

export interface LoginResult {
  user: AuthUser;
  tokens: TokenBundle;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrisma,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, correlationId: string): Promise<LoginResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.client.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw errors.unauthenticated('Credenciais inválidas');
    }

    const passwordMatches = await verify(user.passwordHash, dto.password);
    if (!passwordMatches) {
      throw errors.unauthenticated('Credenciais inválidas');
    }

    const memberships = await this.tenantPrisma.runAsUser(user.id, (tx) =>
      tx.membership.findMany({
        where: { userId: user.id, active: true },
        include: { tenant: { select: { slug: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    );

    if (memberships.length === 0) {
      throw errors.forbidden('Usuário sem vínculo ativo');
    }

    const membership = this.selectMembership(memberships, dto.tenantSlug);
    const authUser = this.toAuthUser(user, membership);
    const tokens = await this.issueTokens(authUser);

    try {
      await this.audit.record({
        tenantId: authUser.tenantId,
        actorId: authUser.id,
        action: 'auth.login',
        entity: 'user',
        entityId: authUser.id,
        diff: { tenantSlug: authUser.tenantSlug },
        correlationId,
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar auditoria de login: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return { user: authUser, tokens };
  }

  async refresh(
    rawRefreshToken: string | undefined,
    correlationId: string,
  ): Promise<LoginResult> {
    if (!rawRefreshToken) {
      throw errors.unauthenticated();
    }

    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    const stored = await this.prisma.client.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!stored) {
      throw errors.unauthenticated();
    }

    if (stored.revokedAt !== null) {
      await this.prisma.client.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw errors.unauthenticated('Token reutilizado');
    }

    if (
      stored.expiresAt <= new Date() ||
      stored.user.status !== 'ACTIVE'
    ) {
      throw errors.unauthenticated();
    }

    const membership = await this.tenantPrisma.runAsUser(
      stored.user.id,
      (tx) =>
        tx.membership.findUnique({
          where: { id: stored.membershipId },
          include: { tenant: { select: { slug: true } } },
        }),
    );

    if (!membership || !membership.active) {
      throw errors.unauthenticated();
    }

    const revoked = await this.prisma.client.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revoked.count !== 1) {
      await this.prisma.client.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw errors.unauthenticated('Token reutilizado');
    }

    const authUser = this.toAuthUser(stored.user, membership);
    const tokens = await this.issueTokens(authUser);

    try {
      await this.audit.record({
        tenantId: authUser.tenantId,
        actorId: authUser.id,
        action: 'auth.refresh',
        entity: 'user',
        entityId: authUser.id,
        correlationId,
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar auditoria de refresh: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return { user: authUser, tokens };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    await this.prisma.client.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private selectMembership(
    memberships: Array<{
      active: boolean;
      role: MembershipRole;
      id: string;
      tenantId: string;
      permissionOverrides: unknown;
      tenant: { slug: string };
    }>,
    tenantSlug: string | undefined,
  ) {
    if (tenantSlug) {
      const match = memberships.find(
        (membership) => membership.tenant.slug === tenantSlug,
      );
      if (!match) {
        throw errors.forbidden('Sem vínculo com a empresa informada');
      }
      return match;
    }

    if (memberships.length > 1) {
      throw errors.conflict('Selecione a empresa para entrar', {
        availableTenants: memberships.map((membership) => ({
          slug: membership.tenant.slug,
        })),
      });
    }

    const only = memberships[0];
    if (!only) {
      throw errors.forbidden('Usuário sem vínculo ativo');
    }
    return only;
  }

  private toAuthUser(
    user: { id: string; email: string; name: string },
    membership: {
      id: string;
      tenantId: string;
      role: MembershipRole;
      permissionOverrides: unknown;
      tenant: { slug: string };
    },
  ): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      membershipId: membership.id,
      tenantId: membership.tenantId,
      tenantSlug: membership.tenant.slug,
      role: membership.role,
      permissions: this.resolvePermissions(
        membership.role,
        membership.permissionOverrides,
      ),
    };
  }

  private resolvePermissions(
    role: MembershipRole,
    overrides: unknown,
  ): Permission[] {
    if (Array.isArray(overrides)) {
      return overrides.filter(
        (value): value is Permission =>
          typeof value === 'string' &&
          (ALL_PERMISSIONS as readonly string[]).includes(value),
      );
    }
    return permissionsForRole(role);
  }

  private async issueTokens(user: AuthUser): Promise<TokenBundle> {
    const accessExpiresInSeconds = parseTtlSeconds(
      this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
      900,
    );
    const refreshExpiresInSeconds =
      (this.config.get<number>('REFRESH_TTL_DAYS') ?? 30) * 86_400;

    const payload: AccessTokenPayload = {
      sub: user.id,
      tid: user.tenantId,
      mid: user.membershipId,
      tslug: user.tenantSlug,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      type: 'access',
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresInSeconds,
    });

    const rawRefreshToken = randomBytes(48).toString('base64url');
    await this.prisma.client.refreshToken.create({
      data: {
        userId: user.id,
        membershipId: user.membershipId,
        tokenHash: this.hashRefreshToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + refreshExpiresInSeconds * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      accessExpiresInSeconds,
      refreshExpiresInSeconds,
    };
  }

  private hashRefreshToken(rawToken: string): string {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    )
      .update(rawToken)
      .digest('hex');
  }
}

export function parseTtlSeconds(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(trimmed);
  if (!match) {
    return fallback;
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  const factor = unit === 'd' ? 86_400 : unit === 'h' ? 3_600 : unit === 'm' ? 60 : 1;
  return amount * factor;
}
