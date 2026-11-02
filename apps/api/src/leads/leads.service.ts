import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@vs/db';
import { TenantPrisma } from '@vs/db';
import {
  canTransitionLead,
  errors,
  type LeadDetail,
  type LeadEventView,
  type LeadListPayload,
  type LeadStatus,
  type LeadSummary,
} from '@vs/shared';
import { AuditService } from '../audit/audit.service';
import { CmsService } from '../cms/cms.service';
import { OutboxService } from '../outbox/outbox.service';
import type { PublicTenant } from '../tenant/tenant.service';
import type {
  CreateLeadDto,
  ListLeadsQueryDto,
  UpdateLeadStatusDto,
} from './dto/leads.dto';

interface LeadContext {
  ip: string;
  userAgent?: string;
}

@Injectable()
export class LeadsService {
  async exportCsv(tenantId: string, query: ListLeadsQueryDto) {
    const result = await this.list(tenantId, query);
    const headers = ['Protocolo', 'Nome', 'WhatsApp', 'Cidade', 'Estado', 'Interesse', 'Origem', 'Status', 'Criado em'];
    const rows = result.items.map((l) => [
      l.protocol,
      l.name,
      l.whatsapp,
      l.city ?? '',
      l.neighborhood ?? '',
      l.serviceType,
      l.source ?? '',
      l.status,
      new Date(l.createdAt).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(','))].join('\n');
    return csv;
  }
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly tenantPrisma: TenantPrisma,
    private readonly cms: CmsService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
  ) {}

  async createPublic(
    tenant: PublicTenant,
    dto: CreateLeadDto,
    idempotencyKey: string,
    context: LeadContext,
  ): Promise<{ protocol: string; accepted: true; duplicate: boolean }> {
    if (dto.website && dto.website.trim().length > 0) {
      return { protocol: 'RECEBIDO', accepted: true, duplicate: false };
    }

    if (
      !idempotencyKey ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 128
    ) {
      throw errors.validation('Cabeçalho Idempotency-Key inválido');
    }

    const policy = await this.cms.getCurrentLegal(tenant.id, 'privacidade');
    const consentText = policy
      ? `Li e aceito a ${policy.title} (versão ${policy.version}).`
      : 'Li e aceito a Política de Privacidade.';

    const result = await this.tenantPrisma.run(tenant.id, async (tx) => {
      const duplicate = await tx.lead.findFirst({
        where: { tenantId: tenant.id, idempotencyKey },
        select: { protocol: true },
      });
      if (duplicate) {
        return {
          protocol: duplicate.protocol,
          duplicate: true,
          outboxCreated: false,
        };
      }

      const [settings, admin] = await Promise.all([
        tx.tenantSettings.findUnique({ where: { tenantId: tenant.id } }),
        tx.membership.findFirst({
          where: { tenantId: tenant.id, role: 'ADMIN', active: true },
          include: { user: { select: { email: true } } },
        }),
      ]);

      const counters = await tx.$queryRaw<Array<{ value: number }>>`
        INSERT INTO "tenant_counters" ("id", "tenant_id", "key", "value", "updated_at")
        VALUES (gen_random_uuid(), ${tenant.id}::uuid, 'lead', 1, now())
        ON CONFLICT ("tenant_id", "key")
        DO UPDATE SET "value" = "tenant_counters"."value" + 1, "updated_at" = now()
        RETURNING "value"
      `;
      const sequence = Number(counters[0]?.value ?? 1);
      const protocol = buildProtocol(sequence);

      const lead = await tx.lead.create({
        data: {
          tenantId: tenant.id,
          protocol,
          source: 'SITE',
          name: dto.name.trim(),
          whatsapp: dto.whatsapp.trim(),
          email: dto.email?.trim() || null,
          city: dto.city.trim(),
          neighborhood: dto.neighborhood?.trim() || null,
          serviceType: dto.serviceType.trim(),
          equipmentCount: dto.equipmentCount,
          btu: dto.btu ?? null,
          notes: dto.notes?.trim() || null,
          idempotencyKey,
          ip: context.ip,
          userAgent: context.userAgent ?? null,
          utm: normalizeUtm(dto.utm) ?? undefined,
          consent: {
            create: {
              tenantId: tenant.id,
              policySlug: 'privacidade',
              policyVersion: policy?.version ?? 1,
              text: consentText,
              ip: context.ip,
              userAgent: context.userAgent ?? null,
            },
          },
          events: {
            create: {
              tenantId: tenant.id,
              type: 'CREATED',
              metadata: { source: 'SITE', protocol },
            },
          },
        },
        select: { id: true, protocol: true },
      });

      const recipient =
        settings?.replyToEmail ?? settings?.contactEmail ?? admin?.user.email;
      if (!recipient) {
        this.logger.warn(
          `Tenant ${tenant.id} sem destinatário para notificação de lead`,
        );
        return { protocol: lead.protocol, duplicate: false, outboxCreated: false };
      }

      await tx.outbox.create({
        data: {
          tenantId: tenant.id,
          channel: 'EMAIL',
          template: 'LEAD_NOTIFICATION',
          recipient,
          subject: `Novo lead: ${dto.name} — ${dto.serviceType}`,
          payload: {
            tenantName: tenant.name,
            leadName: dto.name,
            service: dto.serviceType,
            city: dto.city,
            leadId: lead.id,
            protocol: lead.protocol,
          },
          dedupeKey: `lead:${lead.id}:email`,
        },
      });

      return { protocol: lead.protocol, duplicate: false, outboxCreated: true };
    });

    if (result.outboxCreated) {
      void this.outbox.processTenant(tenant.id).catch((error: unknown) => {
        this.logger.error(
          `Falha ao processar outbox após lead ${result.protocol}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    }

    return {
      protocol: result.protocol,
      accepted: true,
      duplicate: result.duplicate,
    };
  }

  async list(
    tenantId: string,
    query: ListLeadsQueryDto,
  ): Promise<LeadListPayload> {
    const limit = query.limit ?? 25;
    const cursor = decodeCursor(query.cursor);
    const where: Prisma.LeadWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { whatsapp: { contains: query.q } },
              { protocol: { contains: query.q, mode: 'insensitive' } },
              { city: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(cursor
        ? {
            AND: [
              {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                ],
              },
            ],
          }
        : {}),
    };

    const rows = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.lead.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
    );

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    const last = items.at(-1);

    return {
      items: items.map(toSummary),
      nextCursor:
        hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async get(tenantId: string, id: string): Promise<LeadDetail> {
    const lead = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.lead.findFirst({
        where: { id, tenantId },
        include: {
          consent: true,
          events: { orderBy: { createdAt: 'asc' } },
        },
      }),
    );

    if (!lead) {
      throw errors.notFound('Lead não encontrado');
    }

    return {
      ...toSummary(lead),
      utm: normalizeUtm(lead.utm),
      estimateSnapshot: lead.estimateSnapshot,
      consent: lead.consent
        ? {
            policySlug: lead.consent.policySlug,
            policyVersion: lead.consent.policyVersion,
            text: lead.consent.text,
            createdAt: lead.consent.createdAt.toISOString(),
          }
        : null,
      events: lead.events.map(toEvent),
    };
  }

  async updateStatus(
    tenantId: string,
    id: string,
    actorId: string,
    input: UpdateLeadStatusDto,
    correlationId: string,
  ): Promise<LeadDetail> {
    const nextStatus = input.status as LeadStatus;

    await this.tenantPrisma.run(tenantId, async (tx) => {
      const lead = await tx.lead.findFirst({ where: { id, tenantId } });
      if (!lead) {
        throw errors.notFound('Lead não encontrado');
      }
      if (lead.status === nextStatus) {
        throw errors.conflict('O lead já está neste status');
      }
      if (!canTransitionLead(lead.status, nextStatus)) {
        throw errors.conflict(
          `Transição de ${lead.status} para ${nextStatus} não permitida`,
        );
      }

      await tx.lead.update({
        where: { id },
        data: {
          status: nextStatus,
          statusUpdatedAt: new Date(),
          firstResponseAt:
            lead.firstResponseAt ??
            (lead.status === 'NEW' ? new Date() : lead.firstResponseAt),
        },
      });

      await tx.leadEvent.create({
        data: {
          tenantId,
          leadId: id,
          type: 'STATUS_CHANGED',
          fromStatus: lead.status,
          toStatus: nextStatus,
          note: input.note?.trim() || null,
          actorId,
        },
      });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'lead.status.update',
      entity: 'Lead',
      entityId: id,
      correlationId,
      diff: { status: nextStatus },
    });

    return this.get(tenantId, id);
  }

  async addNote(
    tenantId: string,
    id: string,
    actorId: string,
    note: string,
    correlationId: string,
  ): Promise<LeadDetail> {
    await this.tenantPrisma.run(tenantId, async (tx) => {
      const lead = await tx.lead.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
      if (!lead) {
        throw errors.notFound('Lead não encontrado');
      }

      await tx.leadEvent.create({
        data: {
          tenantId,
          leadId: id,
          type: 'NOTE',
          note: note.trim(),
          actorId,
        },
      });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'lead.note.create',
      entity: 'Lead',
      entityId: id,
      correlationId,
    });

    return this.get(tenantId, id);
  }
}

function buildProtocol(sequence: number): string {
  return `LD-${new Date().getUTCFullYear()}-${String(sequence).padStart(5, '0')}`;
}

function normalizeUtm(
  value: unknown,
): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' && item.trim().length > 0) {
      result[key.slice(0, 40)] = item.trim().slice(0, 240);
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ t: createdAt.toISOString(), id }),
    'utf8',
  ).toString('base64url');
}

function decodeCursor(
  raw: string | undefined,
): { createdAt: Date; id: string } | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, 'base64url').toString('utf8'),
    ) as { t?: unknown; id?: unknown };
    if (typeof parsed.t !== 'string' || typeof parsed.id !== 'string') {
      return null;
    }
    const createdAt = new Date(parsed.t);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }
    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

interface LeadRow {
  id: string;
  protocol: string;
  status: LeadSummary['status'];
  source: LeadSummary['source'];
  name: string;
  whatsapp: string;
  email: string | null;
  city: string;
  neighborhood: string | null;
  serviceType: string;
  equipmentCount: number;
  btu: number | null;
  notes: string | null;
  firstResponseAt: Date | null;
  statusUpdatedAt: Date;
  createdAt: Date;
}

function toSummary(lead: LeadRow): LeadSummary {
  return {
    id: lead.id,
    protocol: lead.protocol,
    status: lead.status,
    source: lead.source,
    name: lead.name,
    whatsapp: lead.whatsapp,
    email: lead.email,
    city: lead.city,
    neighborhood: lead.neighborhood,
    serviceType: lead.serviceType,
    equipmentCount: lead.equipmentCount,
    btu: lead.btu,
    notes: lead.notes,
    firstResponseAt: lead.firstResponseAt?.toISOString() ?? null,
    statusUpdatedAt: lead.statusUpdatedAt.toISOString(),
    createdAt: lead.createdAt.toISOString(),
  };
}

function toEvent(event: {
  id: string;
  type: LeadEventView['type'];
  fromStatus: LeadEventView['fromStatus'];
  toStatus: LeadEventView['toStatus'];
  note: string | null;
  actorId: string | null;
  createdAt: Date;
}): LeadEventView {
  return {
    id: event.id,
    type: event.type,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    note: event.note,
    actorId: event.actorId,
    createdAt: event.createdAt.toISOString(),
  };
}
