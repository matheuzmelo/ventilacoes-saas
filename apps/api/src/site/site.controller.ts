import { Controller, Get, Headers, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/public.decorator';
import { SiteService } from './site.service';

@Public()
@Controller('public/v1')
export class SiteController {
  constructor(private readonly site: SiteService) {}

  @Get('site')
  getSite(
    @Headers('x-tenant-host') tenantHost: string | undefined,
    @Req() request: Request,
  ) {
    return this.site.getSite(hostOf(tenantHost, request));
  }

  @Get('pages/:slug')
  getPage(
    @Headers('x-tenant-host') tenantHost: string | undefined,
    @Param('slug') slug: string,
    @Req() request: Request,
  ) {
    return this.site.getPage(hostOf(tenantHost, request), slug);
  }

  @Get('legal/:slug')
  getLegal(
    @Headers('x-tenant-host') tenantHost: string | undefined,
    @Param('slug') slug: string,
    @Req() request: Request,
  ) {
    return this.site.getLegal(hostOf(tenantHost, request), slug);
  }
}

function hostOf(
  tenantHost: string | undefined,
  request: Request,
): string | undefined {
  return tenantHost ?? request.headers.host;
}
