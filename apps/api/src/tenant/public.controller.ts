import { Controller, Get, Headers, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/public.decorator';
import { TenantService, type PublicTenant } from './tenant.service';

@Controller('public/v1')
export class PublicController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Get('tenant')
  async tenant(
    @Headers('x-tenant-host') tenantHost: string | undefined,
    @Req() request: Request,
  ): Promise<PublicTenant> {
    return this.tenantService.resolveByHost(tenantHost ?? request.headers.host);
  }
}
