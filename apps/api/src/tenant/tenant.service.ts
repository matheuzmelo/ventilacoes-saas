import { Injectable } from '@nestjs/common';
import { TenantPrisma } from '@vs/db';
import { errors, type TenantSummary } from '@vs/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateSiteSettingsDto } from './dto/site-settings.dto';

export interface PublicTenant extends TenantSummary {
  locale: string;
  estimateMode: 'RANGE' | 'COLLECT_ONLY';
}

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrisma,
  ) {}

  async resolveByHost(rawHost: string | undefined): Promise<PublicTenant> {
    const host = normalizeHost(rawHost);
    if (!host) {
      throw errors.notFound('Site não encontrado');
    }

    const candidates = host.startsWith('www.')
      ? [host, host.slice(4)]
      : [host];

    for (const candidate of candidates) {
      const domain = await this.prisma.client.tenantDomain.findUnique({
        where: { host: candidate },
        include: { tenant: true },
      });

      if (domain && domain.tenant.status === 'ACTIVE') {
        const tenantId = domain.tenant.id;
        const settings = await this.tenantPrisma.run(tenantId, (tx) =>
          tx.tenantSettings.findUnique({ where: { tenantId } }),
        );

        return {
          id: tenantId,
          slug: domain.tenant.slug,
          name: domain.tenant.name,
          timezone: settings?.timezone ?? 'America/Sao_Paulo',
          locale: settings?.locale ?? 'pt-BR',
          currency: settings?.currency ?? 'BRL',
          estimateMode: settings?.estimateMode ?? 'RANGE',
        };
      }
    }

    throw errors.notFound('Site não encontrado');
  }

  async updateSiteSettings(
    tenantId: string,
    input: UpdateSiteSettingsDto,
  ): Promise<void> {
    const data = {
      ...(input.siteTitle === undefined
        ? {}
        : { siteTitle: input.siteTitle || null }),
      ...(input.siteDescription === undefined
        ? {}
        : { siteDescription: input.siteDescription || null }),
      ...(input.logoUrl === undefined
        ? {}
        : { logoUrl: input.logoUrl || null }),
      ...(input.primaryColor === undefined
        ? {}
        : { primaryColor: input.primaryColor }),
      ...(input.secondaryColor === undefined
        ? {}
        : { secondaryColor: input.secondaryColor }),
      ...(input.phone === undefined ? {} : { phone: input.phone || null }),
      ...(input.whatsapp === undefined
        ? {}
        : { whatsapp: input.whatsapp || null }),
      ...(input.contactEmail === undefined
        ? {}
        : { contactEmail: input.contactEmail || null }),
      ...(input.address === undefined
        ? {}
        : { address: input.address || null }),
      ...(input.serviceAreas === undefined
        ? {}
        : { serviceAreas: input.serviceAreas }),
      ...(input.whatsappMessage === undefined
        ? {}
        : { whatsappMessage: input.whatsappMessage || null }),
      ...(input.instagramUrl === undefined
        ? {}
        : { instagramUrl: input.instagramUrl || null }),
      ...(input.facebookUrl === undefined
        ? {}
        : { facebookUrl: input.facebookUrl || null }),
      ...(input.googleBusinessUrl === undefined
        ? {}
        : { googleBusinessUrl: input.googleBusinessUrl || null }),
      ...(input.senderName === undefined
        ? {}
        : { senderName: input.senderName || null }),
      ...(input.replyToEmail === undefined
        ? {}
        : { replyToEmail: input.replyToEmail || null }),
    };

    await this.tenantPrisma.run(tenantId, (tx) =>
      tx.tenantSettings.upsert({
        where: { tenantId },
        update: data,
        create: { tenantId, ...data },
      }),
    );
  }
}

function normalizeHost(rawHost: string | undefined): string {
  if (!rawHost) {
    return '';
  }
  const withoutPort = rawHost.split(',')[0]?.trim().toLowerCase() ?? '';
  return withoutPort.replace(/:\d+$/, '');
}
