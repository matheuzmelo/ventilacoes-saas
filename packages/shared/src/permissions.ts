export const MEMBERSHIP_ROLES = ['ADMIN', 'INSTALLER'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const PERMISSIONS = {
  SETTINGS_MANAGE: 'settings.manage',
  USERS_MANAGE: 'users.manage',
  LEADS_READ: 'leads.read',
  LEADS_WRITE: 'leads.write',
  QUOTES_READ: 'quotes.read',
  QUOTES_WRITE: 'quotes.write',
  QUOTES_SEND: 'quotes.send',
  QUOTES_DISCOUNT: 'quotes.discount',
  QUOTES_COST_READ: 'quotes.cost.read',
  QUOTES_MARGIN_READ: 'quotes.margin.read',
  WORK_ORDERS_READ_ALL: 'work_orders.read_all',
  WORK_ORDERS_READ_OWN: 'work_orders.read_own',
  WORK_ORDERS_ASSIGN: 'work_orders.assign',
  WORK_ORDERS_EXECUTE: 'work_orders.execute',
  CHARGES_MANAGE: 'charges.manage',
  CMS_MANAGE: 'cms.manage',
  MESSAGES_READ: 'messages.read',
  AUDIT_READ: 'audit.read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  INSTALLER: [
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.WORK_ORDERS_READ_OWN,
    PERMISSIONS.WORK_ORDERS_EXECUTE,
  ],
};

export function permissionsForRole(role: MembershipRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function hasPermission(
  granted: readonly string[],
  required: Permission | readonly Permission[],
): boolean {
  const wanted = Array.isArray(required) ? required : [required];
  return wanted.every((permission) => granted.includes(permission));
}
