import type { Prisma, PrismaClient } from '../generated/client/client.js';

/**
 * Executa operações dentro de uma transação com o tenant (e opcionalmente o
 * usuário) definidos via `set_config(..., true)`. As políticas RLS leem esses
 * valores por transação, então nunca reutilize o client fora do callback.
 */
export class TenantPrisma {
  constructor(private readonly prisma: PrismaClient) {}

  async run<T>(
    tenantId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!tenantId) {
      throw new Error('tenantId é obrigatório para operações com RLS');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return fn(tx);
    });
  }

  /**
   * Usado apenas pelo fluxo de autenticação, antes de existir uma sessão:
   * permite listar os vínculos do próprio usuário sem revelar outros tenants.
   */
  async runAsUser<T>(
    userId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!userId) {
      throw new Error('userId é obrigatório para operações de autenticação');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
      return fn(tx);
    });
  }
}
