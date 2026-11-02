import { Injectable } from '@nestjs/common';
import { TenantPrisma } from '@vs/db';
import {
  errors,
  type LegalDocumentView,
  type SiteIdentity,
  type SitePagePayload,
  type SitePageView,
  type SitePayload,
} from '@vs/shared';
import { CmsService } from '../cms/cms.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class SiteService {
  constructor(
    private readonly tenants: TenantService,
    private readonly tenantPrisma: TenantPrisma,
    private readonly cms: CmsService,
  ) {}

  async getSite(host: string | undefined): Promise<SitePayload> {
    const tenant = await this.tenants.resolveByHost(host);
    const [settings, navigation, home, faq, legal] = await Promise.all([
      this.tenantPrisma.run(tenant.id, (tx) =>
        tx.tenantSettings.findUnique({ where: { tenantId: tenant.id } }),
      ),
      this.cms.getNavigation(tenant.id),
      this.cms.getPublishedPage(tenant.id, 'home'),
      this.cms.getPublishedFaq(tenant.id),
      this.cms.getLegalSummary(tenant.id),
    ]);

    return {
      tenant,
      identity: buildIdentity(tenant.name, settings),
      navigation,
      home,
      faq,
      legal,
    };
  }

  async getPage(
    host: string | undefined,
    slug: string,
  ): Promise<SitePagePayload> {
    const tenant = await this.tenants.resolveByHost(host);
    const [page, faq] = await Promise.all([
      this.cms.getPublishedPage(tenant.id, slug),
      this.cms.getPublishedFaq(tenant.id),
    ]);

    if (!page) {
      throw errors.notFound('Página não encontrada');
    }

    return { tenant, page, faq };
  }

  async getLegal(
    host: string | undefined,
    slug: string,
  ): Promise<{ tenant: SitePayload['tenant']; document: LegalDocumentView }> {
    if (slug !== 'privacidade' && slug !== 'termos') {
      throw errors.notFound('Documento não encontrado');
    }

    const tenant = await this.tenants.resolveByHost(host);
    const document = await this.cms.getCurrentLegal(tenant.id, slug);
    if (!document) {
      throw errors.notFound('Documento não encontrado');
    }

    return { tenant, document };
  }

  async getHome(host: string | undefined): Promise<SitePageView | null> {
    const tenant = await this.tenants.resolveByHost(host);
    return this.cms.getPublishedPage(tenant.id, 'home');
  }
}

function buildIdentity(
  tenantName: string,
  settings: {
    siteTitle: string | null;
    siteDescription: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    phone: string | null;
    whatsapp: string | null;
    contactEmail: string | null;
    address: string | null;
    serviceAreas: unknown;
    whatsappMessage: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    googleBusinessUrl: string | null;
  } | null,
): SiteIdentity {
  return {
    title: settings?.siteTitle ?? tenantName,
    description:
      settings?.siteDescription ??
      'Instalação, manutenção e higienização de ar-condicionado com atendimento local.',
    logoUrl: settings?.logoUrl ?? null,
    primaryColor: settings?.primaryColor ?? null,
    secondaryColor: settings?.secondaryColor ?? null,
    phone: settings?.phone ?? null,
    whatsapp: settings?.whatsapp ?? null,
    contactEmail: settings?.contactEmail ?? null,
    address: settings?.address ?? null,
    serviceAreas: parseServiceAreas(settings?.serviceAreas),
    whatsappMessage:
      settings?.whatsappMessage ??
      'Olá! Gostaria de solicitar um orçamento de ar-condicionado.',
    instagramUrl: settings?.instagramUrl ?? null,
    facebookUrl: settings?.facebookUrl ?? null,
    googleBusinessUrl: settings?.googleBusinessUrl ?? null,
  };
}

function parseServiceAreas(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}
