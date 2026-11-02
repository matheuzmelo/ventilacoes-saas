import { randomUUID } from 'node:crypto';
import {
  createAdminPrismaClient,
  createPrismaClient,
  TenantPrisma,
  type PrismaClient,
} from '@vs/db';

describe('isolamento por RLS', () => {
  const suffix = randomUUID().slice(0, 8);
  const hostA = `tenant-a-${suffix}.lvh.me`;
  const hostB = `tenant-b-${suffix}.lvh.me`;

  let admin: PrismaClient;
  let runtime: PrismaClient;
  let tenantPrisma: TenantPrisma;
  let tenantAId: string;
  let tenantBId: string;
  let auditBId: string;
  let leadBId: string;

  beforeAll(async () => {
    admin = createAdminPrismaClient();
    runtime = createPrismaClient();
    tenantPrisma = new TenantPrisma(runtime);

    await admin.$connect();
    await runtime.$connect();

    const [tenantA, tenantB] = await Promise.all([
      admin.tenant.create({
        data: {
          slug: `tenant-a-${suffix}`,
          name: 'Tenant A',
          domains: { create: { host: hostA, isPrimary: true } },
          settings: { create: {} },
        },
      }),
      admin.tenant.create({
        data: {
          slug: `tenant-b-${suffix}`,
          name: 'Tenant B',
          domains: { create: { host: hostB, isPrimary: true } },
          settings: { create: {} },
        },
      }),
    ]);

    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const [userA, userB] = await Promise.all([
      admin.user.create({
        data: {
          email: `a-${suffix}@example.test`,
          name: 'User A',
          passwordHash: 'not-used',
        },
      }),
      admin.user.create({
        data: {
          email: `b-${suffix}@example.test`,
          name: 'User B',
          passwordHash: 'not-used',
        },
      }),
    ]);

    await Promise.all([
      admin.membership.create({
        data: { tenantId: tenantAId, userId: userA.id, role: 'ADMIN' },
      }),
      admin.membership.create({
        data: { tenantId: tenantBId, userId: userB.id, role: 'ADMIN' },
      }),
    ]);

    await admin.auditLog.createMany({
      data: [
        {
          tenantId: tenantAId,
          action: 'isolation.test',
          entity: 'test',
          correlationId: `a-${suffix}`,
        },
        {
          tenantId: tenantBId,
          action: 'isolation.test',
          entity: 'test',
          correlationId: `b-${suffix}`,
        },
      ],
    });

    const auditB = await admin.auditLog.findFirstOrThrow({
      where: { tenantId: tenantBId },
    });
    auditBId = auditB.id;

    const leadB = await admin.lead.create({
      data: {
        tenantId: tenantBId,
        protocol: `LD-TEST-${suffix}`,
        name: 'Lead B',
        whatsapp: '11999999999',
        city: 'Cidade B',
        serviceType: 'Instalação',
        equipmentCount: 1,
      },
    });
    leadBId = leadB.id;

    await admin.outbox.create({
      data: {
        tenantId: tenantBId,
        channel: 'EMAIL',
        template: 'LEAD_NOTIFICATION',
        recipient: `b-${suffix}@example.test`,
        payload: { leadId: leadB.id },
        dedupeKey: `test-${suffix}`,
      },
    });
  });

  afterAll(async () => {
    await admin.tenant.deleteMany({
      where: { id: { in: [tenantAId, tenantBId] } },
    });
    await admin.user.deleteMany({
      where: { email: { endsWith: `-${suffix}@example.test` } },
    });
    await admin.$disconnect();
    await runtime.$disconnect();
  });

  it('lista apenas registros do tenant no contexto', async () => {
    const logs = await tenantPrisma.run(tenantAId, (tx) =>
      tx.auditLog.findMany({ where: { action: 'isolation.test' } }),
    );

    expect(logs).toHaveLength(1);
    expect(logs[0]?.tenantId).toBe(tenantAId);
  });

  it('retorna null ao buscar id de outro tenant', async () => {
    const log = await tenantPrisma.run(tenantAId, (tx) =>
      tx.auditLog.findUnique({ where: { id: auditBId } }),
    );

    expect(log).toBeNull();
  });

  it('não expõe linhas quando nenhum tenant está definido', async () => {
    const logs = await runtime.auditLog.findMany({
      where: { action: 'isolation.test' },
    });

    expect(logs).toHaveLength(0);
  });

  it('bloqueia insert com tenant divergente do contexto', async () => {
    await expect(
      tenantPrisma.run(tenantAId, (tx) =>
        tx.auditLog.create({
          data: {
            tenantId: tenantBId,
            action: 'isolation.cross',
            entity: 'test',
            correlationId: `cross-${suffix}`,
          },
        }),
      ),
    ).rejects.toThrow();
  });

  it('isola configurações do tenant', async () => {
    const settings = await tenantPrisma.run(tenantAId, (tx) =>
      tx.tenantSettings.findMany(),
    );

    expect(settings).toHaveLength(1);
    expect(settings[0]?.tenantId).toBe(tenantAId);
  });

  it('isola leads e outbox entre tenants', async () => {
    const leads = await tenantPrisma.run(tenantAId, (tx) =>
      tx.lead.findMany(),
    );
    expect(leads).toHaveLength(0);

    const outbox = await tenantPrisma.run(tenantAId, (tx) =>
      tx.outbox.findMany(),
    );
    expect(outbox).toHaveLength(0);

    const leadB = await tenantPrisma.run(tenantAId, (tx) =>
      tx.lead.findUnique({ where: { id: leadBId } }),
    );
    expect(leadB).toBeNull();
  });

  it('bloqueia lead com tenant divergente do contexto', async () => {
    await expect(
      tenantPrisma.run(tenantAId, (tx) =>
        tx.lead.create({
          data: {
            tenantId: tenantBId,
            protocol: `LD-CROSS-${suffix}`,
            name: 'Cross',
            whatsapp: '11999999999',
            city: 'Cidade',
            serviceType: 'Instalação',
            equipmentCount: 1,
          },
        }),
      ),
    ).rejects.toThrow();
  });

  it('isola páginas de CMS e documentos legais', async () => {
    await admin.cmsPage.createMany({
      data: [
        {
          tenantId: tenantAId,
          slug: 'home',
          title: 'A',
          draftBlocks: [],
        },
        {
          tenantId: tenantBId,
          slug: 'home',
          title: 'B',
          draftBlocks: [],
        },
      ],
    });
    await admin.legalDocument.createMany({
      data: [
        {
          tenantId: tenantAId,
          slug: 'privacidade',
          version: 1,
          title: 'A',
          body: 'A',
        },
        {
          tenantId: tenantBId,
          slug: 'privacidade',
          version: 1,
          title: 'B',
          body: 'B',
        },
      ],
    });

    const pages = await tenantPrisma.run(tenantAId, (tx) =>
      tx.cmsPage.findMany(),
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]?.tenantId).toBe(tenantAId);

    const legal = await tenantPrisma.run(tenantAId, (tx) =>
      tx.legalDocument.findMany(),
    );
    expect(legal).toHaveLength(1);
    expect(legal[0]?.tenantId).toBe(tenantAId);
  });
});
