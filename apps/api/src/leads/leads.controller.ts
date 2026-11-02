import { Response,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Response, ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Response, PERMISSIONS, type AuthUser } from '@vs/shared';
import { Response, CurrentUser } from '../common/current-user.decorator';
import { Response, RequirePermissions } from '../common/permissions.decorator';
import { Response, Public } from '../common/public.decorator';
import { Response, getCorrelationId } from '../common/request-context';
import { Response, TenantService } from '../tenant/tenant.service';
import { Response,
  CreateLeadDto,
  CreateLeadNoteDto,
  ListLeadsQueryDto,
  UpdateLeadStatusDto,
} from './dto/leads.dto';
import { Response, LeadsService } from './leads.service';
import { Response, RateLimitService } from './rate-limit.service';

@Public()
@Controller('public/v1/leads')
export class PublicLeadsController {
  constructor(
    private readonly tenants: TenantService,
    private readonly leads: LeadsService,
    private readonly rateLimit: RateLimitService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  async create(
    @Headers('x-tenant-host') tenantHost: string | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: CreateLeadDto,
    @Req() request: Request,
  ) {
    const tenant = await this.tenants.resolveByHost(
      tenantHost ?? request.headers.host,
    );
    const ip = clientIp(request);

    try {
      this.rateLimit.consume(
        `lead:${tenant.id}:${ip}`,
        this.config.get<number>('RATE_LIMIT_LEADS_PER_HOUR') ?? 5,
        60 * 60 * 1000,
      );
    } catch (error) {
      if (body.website) {
        return { protocol: 'RECEBIDO', accepted: true, duplicate: false };
      }
      throw error;
    }

    return this.leads.createPublic(tenant, body, idempotencyKey ?? '', {
      ip,
      userAgent: headerValue(request.headers['user-agent']),
    });
  }
}

@Controller('v1/leads')
export class AdminLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LEADS_READ)
  list(@CurrentUser() user: AuthUser, @Query() query: ListLeadsQueryDto) {
    return this.leads.list(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LEADS_READ)
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.leads.get(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LEADS_WRITE)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateLeadStatusDto,
    @Req() request: Request,
  ) {
    return this.leads.updateStatus(
      user.tenantId,
      id,
      user.id,
      body,
      getCorrelationId(request),
    );
  }

  @Post(':id/notes')
  @RequirePermissions(PERMISSIONS.LEADS_WRITE)
  addNote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateLeadNoteDto,
    @Req() request: Request,
  ) {
    return this.leads.addNote(
      user.tenantId,
      id,
      user.id,
      body.note,
      getCorrelationId(request),
    );
  }
}


  @Get('export')
  @RequirePermissions(PERMISSIONS.LEADS_READ)
  async export(@CurrentUser() user: AuthUser, @Query() query: ListLeadsQueryDto, @Res() res: Response) {
    const csv = await this.leads.exportCsv(user.tenantId, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send(csv);
  }

function clientIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return request.ip ?? request.socket.remoteAddress ?? 'unknown';
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
