import { Injectable } from '@nestjs/common';
import { TenantPrisma } from '@vs/db';

export interface AuditRecordInput {
  tenantId: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: unknown;
  correlationId: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly tenantPrisma: TenantPrisma) {}

  async record(input: AuditRecordInput): Promise<void> {
    await this.tenantPrisma.run(input.tenantId, (tx) =>
      tx.auditLog.create({
        data: {
          tenantId: input.tenantId,
          actorId: input.actorId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          diff:
            input.diff === undefined
              ? undefined
              : (input.diff as object),
          correlationId: input.correlationId,
        },
      }),
    );
  }
}
