import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

export type { Prisma } from '../generated/client/client.js';
export { PrismaClient };

export function createPrismaClient(
  connectionString: string | undefined = process.env.DATABASE_URL,
): PrismaClient {
  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada');
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

/**
 * Client com o papel de migrations/seed (dono das tabelas).
 * Nunca deve ser usado no caminho de request da aplicação.
 */
export function createAdminPrismaClient(
  connectionString: string | undefined = process.env.MIGRATE_DATABASE_URL,
): PrismaClient {
  if (!connectionString) {
    throw new Error('MIGRATE_DATABASE_URL não configurada');
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}
