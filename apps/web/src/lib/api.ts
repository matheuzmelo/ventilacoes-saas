import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import type {
  AuthUser,
  CmsPageAdmin,
  EstimateMode,
  LeadDetail,
  LeadListPayload,
  LegalDocumentView,
  SiteFaqItem,
  SitePagePayload,
  SitePayload,
  TenantSummary,
} from '@vs/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export interface PublicTenant extends TenantSummary {
  locale: string;
  estimateMode: EstimateMode;
}

export interface TenantSettingsView {
  timezone: string;
  locale: string;
  currency: string;
  estimateMode: EstimateMode;
  defaultValidityDays: number;
  maxDiscountPercent: string | number;
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
  senderName: string | null;
  replyToEmail: string | null;
}

export interface TenantSettingsPayload {
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: 'ACTIVE' | 'SUSPENDED';
  };
  settings: TenantSettingsView | null;
  membership: {
    id: string;
    role: 'ADMIN' | 'INSTALLER';
    permissions: string[];
  };
}

export interface OutboxLog {
  id: string;
  channel: string;
  template: string;
  recipient: string;
  subject: string | null;
  status: string;
  attempts: number;
  lastError: string | null;
  providerMessageId: string | null;
  sentAt: string | null;
  createdAt: string;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function authenticatedRequest<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) {
    return null;
  }

  return requestJson<T>(path, {
    headers: { cookie: cookieHeader, accept: 'application/json' },
  });
}

async function currentHost(): Promise<string | null> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? null
  );
}

export const getTenant = cache(async (): Promise<PublicTenant | null> => {
  const host = await currentHost();
  if (!host) {
    return null;
  }

  return requestJson<PublicTenant>('/public/v1/tenant', {
    headers: { 'x-tenant-host': host, accept: 'application/json' },
  });
});

export const getSite = cache(async (): Promise<SitePayload | null> => {
  const host = await currentHost();
  if (!host) {
    return null;
  }

  return requestJson<SitePayload>('/public/v1/site', {
    headers: { 'x-tenant-host': host, accept: 'application/json' },
  });
});

export const getSitePage = cache(
  async (slug: string): Promise<SitePagePayload | null> => {
    const host = await currentHost();
    if (!host) {
      return null;
    }

    return requestJson<SitePagePayload>(`/public/v1/pages/${slug}`, {
      headers: { 'x-tenant-host': host, accept: 'application/json' },
    });
  },
);

export const getLegalDocument = cache(
  async (
    slug: 'privacidade' | 'termos',
  ): Promise<{ tenant: SitePayload['tenant']; document: LegalDocumentView } | null> => {
    const host = await currentHost();
    if (!host) {
      return null;
    }

    return requestJson<{
      tenant: SitePayload['tenant'];
      document: LegalDocumentView;
    }>(`/public/v1/legal/${slug}`, {
      headers: { 'x-tenant-host': host, accept: 'application/json' },
    });
  },
);

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const body = await authenticatedRequest<{ user: AuthUser }>('/v1/auth/me');
  return body?.user ?? null;
});

export const getTenantSettings = cache(
  async (): Promise<TenantSettingsPayload | null> =>
    authenticatedRequest<TenantSettingsPayload>('/v1/tenant'),
);

export const getAdminPages = cache(
  async (): Promise<CmsPageAdmin[]> =>
    (await authenticatedRequest<CmsPageAdmin[]>('/v1/cms/pages')) ?? [],
);

export const getAdminPage = cache(
  async (slug: string): Promise<CmsPageAdmin | null> =>
    authenticatedRequest<CmsPageAdmin>(`/v1/cms/pages/${slug}`),
);

export const getAdminFaq = cache(
  async (): Promise<SiteFaqItem[]> =>
    (await authenticatedRequest<SiteFaqItem[]>('/v1/cms/faq')) ?? [],
);

export const getAdminLegal = cache(
  async (): Promise<LegalDocumentView[]> =>
    (await authenticatedRequest<LegalDocumentView[]>('/v1/cms/legal')) ?? [],
);

export const getLeads = cache(
  async (query = ''): Promise<LeadListPayload> =>
    (await authenticatedRequest<LeadListPayload>(`/v1/leads?${query}`)) ?? {
      items: [],
      nextCursor: null,
    },
);

export const getLead = cache(
  async (id: string): Promise<LeadDetail | null> =>
    authenticatedRequest<LeadDetail>(`/v1/leads/${id}`),
);

export const getOutboxLogs = cache(
  async (): Promise<OutboxLog[]> =>
    (await authenticatedRequest<OutboxLog[]>('/v1/messages/logs')) ?? [],
);
