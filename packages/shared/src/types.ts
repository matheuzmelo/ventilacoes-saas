import type { MembershipRole, Permission } from './permissions';

export const TENANT_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export const ESTIMATE_MODES = ['RANGE', 'COLLECT_ONLY'] as const;
export type EstimateMode = (typeof ESTIMATE_MODES)[number];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  membershipId: string;
  tenantId: string;
  tenantSlug: string;
  role: MembershipRole;
  permissions: Permission[];
}

export interface AccessTokenPayload {
  sub: string;
  tid: string;
  mid: string;
  tslug: string;
  email: string;
  name: string;
  role: MembershipRole;
  permissions: Permission[];
  type: 'access';
}

export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  currency: string;
}
