export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUOTED',
  'SCHEDULED',
  'WON',
  'LOST',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ['SITE', 'WHATSAPP', 'MANUAL'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Em contato',
  QUOTED: 'Orçamento',
  SCHEDULED: 'Agendado',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'QUOTED', 'SCHEDULED', 'WON', 'LOST'],
  CONTACTED: ['QUOTED', 'SCHEDULED', 'WON', 'LOST'],
  QUOTED: ['SCHEDULED', 'WON', 'LOST'],
  SCHEDULED: ['WON', 'LOST'],
  WON: [],
  LOST: [],
};

export function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_STATUS_TRANSITIONS[from].includes(to);
}

export const LEAD_EVENT_TYPES = [
  'CREATED',
  'STATUS_CHANGED',
  'NOTE',
  'NOTIFIED',
] as const;

export type LeadEventType = (typeof LEAD_EVENT_TYPES)[number];

export interface LeadEventView {
  id: string;
  type: LeadEventType;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus | null;
  note: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface LeadSummary {
  id: string;
  protocol: string;
  status: LeadStatus;
  source: LeadSource;
  name: string;
  whatsapp: string;
  email: string | null;
  city: string;
  neighborhood: string | null;
  serviceType: string;
  equipmentCount: number;
  btu: number | null;
  notes: string | null;
  firstResponseAt: string | null;
  statusUpdatedAt: string;
  createdAt: string;
}

export interface LeadDetail extends LeadSummary {
  utm: Record<string, string> | null;
  estimateSnapshot: unknown;
  consent: {
    policySlug: string;
    policyVersion: number;
    text: string;
    createdAt: string;
  } | null;
  events: LeadEventView[];
}

export interface LeadListPayload {
  items: LeadSummary[];
  nextCursor: string | null;
}

export interface LeadStatusUpdate {
  status: LeadStatus;
  note?: string;
}
