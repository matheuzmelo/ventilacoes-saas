import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  PERMISSIONS,
  hasPermission,
  type AuthUser,
} from '@vs/shared';
import { TenantPrisma } from '@vs/db';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/current-user.decorator';
import { RequirePermissions } from '../common/permissions.decorator';
import { getCorrelationId } from '../common/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteSettingsDto } from './dto/site-settings.dto';
import { TenantService } from './tenant.service';

@Controller('v1/tenant')
export class TenantController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrisma,
    private readonly tenantService: TenantService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async current(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.buildPayload(
      user,
      hasPermission(user.permissions, PERMISSIONS.SETTINGS_MANAGE),
    );
  }

  @Get('settings')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async settings(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.buildPayload(user, true);
  }

  @Patch('settings')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateSiteSettingsDto,
    @Req() request: Request,
  ): Promise<unknown> {
    await this.tenantService.updateSiteSettings(user.tenantId, body);
    await this.audit.record({
      tenantId: user.tenantId,
      actorId: user.id,
      action: 'tenant.site_settings.update',
      entity: 'TenantSettings',
      entityId: user.tenantId,
      correlationId: getCorrelationId(request),
    });
    return this.buildPayload(user, true);
  }

  private async buildPayload(
    user: AuthUser,
    includeSettings: boolean,
  ): Promise<unknown> {
    const [tenant, settings] = await Promise.all([
      this.prisma.client.tenant.findUnique({
        where: { id: user.tenantId },
        select: { id: true, slug: true, name: true, status: true },
      }),
      includeSettings
        ? this.tenantPrisma.run(user.tenantId, (tx) =>
            tx.tenantSettings.findUnique({
              where: { tenantId: user.tenantId },
            }),
          )
        : Promise.resolve(null),
    ]);

    return {
      tenant,
      settings,
      membership: {
        id: user.membershipId,
        role: user.role,
        permissions: user.permissions,
      },
    };
  }
}
