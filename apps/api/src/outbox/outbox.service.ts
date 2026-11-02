import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantPrisma } from '@vs/db';
import { leadNotificationEmail } from '@vs/emails';
import { errors } from '@vs/shared';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ATTEMPTS = 5;

export interface OutboxView {
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

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrisma,
    private readonly config: ConfigService,
  ) {}

  async processTenant(tenantId: string): Promise<number> {
    const pending = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.outbox.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          nextAttemptAt: { lte: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
    );

    for (const item of pending) {
      await this.attempt(tenantId, item.id);
    }

    return pending.length;
  }

  async processAllTenants(): Promise<void> {
    const tenants = await this.prisma.client.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        await this.processTenant(tenant.id);
      } catch (error) {
        this.logger.error(
          `Falha ao processar outbox do tenant ${tenant.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  async listLogs(tenantId: string, limit = 100): Promise<OutboxView[]> {
    const items = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.outbox.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 200),
      }),
    );

    return items.map((item) => ({
      id: item.id,
      channel: item.channel,
      template: item.template,
      recipient: item.recipient,
      subject: item.subject,
      status: item.status,
      attempts: item.attempts,
      lastError: item.lastError,
      providerMessageId: item.providerMessageId,
      sentAt: item.sentAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async retry(tenantId: string, id: string): Promise<void> {
    const item = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.outbox.findFirst({ where: { id, tenantId } }),
    );
    if (!item) {
      throw errors.notFound('Envio não encontrado');
    }

    await this.tenantPrisma.run(tenantId, (tx) =>
      tx.outbox.update({
        where: { id },
        data: {
          status: 'PENDING',
          nextAttemptAt: new Date(),
          lastError: null,
        },
      }),
    );

    void this.processTenant(tenantId).catch((error: unknown) => {
      this.logger.error(
        `Falha ao reenviar outbox ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  private async attempt(tenantId: string, id: string): Promise<void> {
    const item = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.outbox.findFirst({ where: { id, tenantId } }),
    );
    if (!item || item.status !== 'PENDING') {
      return;
    }

    try {
      if (item.channel !== 'EMAIL') {
        throw new Error(`Canal ${item.channel} ainda não suportado`);
      }
      if (item.template !== 'LEAD_NOTIFICATION') {
        throw new Error(`Template ${item.template} não suportado`);
      }

      const result = await this.sendEmail(item);
      await this.tenantPrisma.run(tenantId, (tx) =>
        tx.outbox.update({
          where: { id },
          data: {
            status: 'SENT',
            attempts: item.attempts + 1,
            sentAt: new Date(),
            lastError: null,
            providerMessageId: result.id,
          },
        }),
      );
    } catch (error) {
      const attempts = item.attempts + 1;
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido no envio';

      await this.tenantPrisma.run(tenantId, (tx) =>
        tx.outbox.update({
          where: { id },
          data: {
            status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
            attempts,
            nextAttemptAt: new Date(
              Date.now() + Math.min(2 ** attempts, 60) * 60_000,
            ),
            lastError: message.slice(0, 500),
          },
        }),
      );

      this.logger.warn(`Outbox ${id} falhou (tentativa ${attempts}): ${message}`);
    }
  }

  private async sendEmail(item: {
    subject: string | null;
    recipient: string;
    payload: unknown;
  }): Promise<{ id: string }> {
    const payload = item.payload as {
      tenantName?: unknown;
      leadName?: unknown;
      service?: unknown;
      city?: unknown;
      leadId?: unknown;
    };

    const leadId = typeof payload.leadId === 'string' ? payload.leadId : '';
    const message = leadNotificationEmail({
      tenantName:
        typeof payload.tenantName === 'string' ? payload.tenantName : 'Empresa',
      leadName:
        typeof payload.leadName === 'string' ? payload.leadName : 'Cliente',
      service: typeof payload.service === 'string' ? payload.service : 'Serviço',
      city: typeof payload.city === 'string' ? payload.city : '',
      panelUrl: `${this.webUrl()}/admin/leads/${leadId}`,
    });

    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new Error('RESEND_API_KEY não configurada');
      }

      this.logger.log(
        `[dev-email] para=${item.recipient} assunto="${message.subject}"`,
      );
      return { id: `dev-${Date.now()}` };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.get<string>('MAIL_FROM'),
        to: [item.recipient],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(this.config.get<string>('MAIL_REPLY_TO')
          ? { reply_to: this.config.get<string>('MAIL_REPLY_TO') }
          : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Resend respondeu ${response.status}: ${detail.slice(0, 300)}`,
      );
    }

    const body = (await response.json()) as { id?: string };
    return { id: body.id ?? `resend-${Date.now()}` };
  }

  private webUrl(): string {
    return this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';
  }
}
