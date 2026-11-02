import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import { createAdminPrismaClient, type PrismaClient } from '@vs/db';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { OutboxService } from '../src/outbox/outbox.service';

const PASSWORD = 'SenhaForte123!';
const HOME_BLOCKS = [
  {
    type: 'hero',
    title: 'Ar-condicionado sem sustos',
    subtitle: 'Atendimento local e orçamento claro.',
    ctaLabel: 'Pedir orçamento',
    ctaHref: '#contato',
  },
  { type: 'contact', title: 'Fale com a equipe' },
];

describe('Site, CMS e leads (e2e)', () => {
  const suffix = randomUUID().slice(0, 8);
  const host = `site-${suffix}.lvh.me`;
  const otherHost = `other-${suffix}.lvh.me`;
  const adminEmail = `site-admin-${suffix}@example.test`;
  const installerEmail = `site-installer-${suffix}@example.test`;

  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let prisma: PrismaClient;
  let tenantId: string;
  let otherTenantId: string;
  let userIds: string[] = [];

  beforeAll(async () => {
    prisma = createAdminPrismaClient();
    await prisma.$connect();

    const passwordHash = await hash(PASSWORD);
    const tenant = await prisma.tenant.create({
      data: {
        slug: `site-${suffix}`,
        name: 'Empresa Site',
        domains: { create: { host, isPrimary: true } },
        settings: {
          create: {
            siteTitle: 'Empresa Site Climatização',
            siteDescription: 'Descrição pública da empresa.',
            replyToEmail: `leads-${suffix}@example.test`,
            whatsapp: '5511999999999',
            serviceAreas: ['São Paulo'],
          },
        },
      },
    });
    tenantId = tenant.id;

    const other = await prisma.tenant.create({
      data: {
        slug: `other-${suffix}`,
        name: 'Outra Empresa',
        domains: { create: { host: otherHost, isPrimary: true } },
        settings: { create: { replyToEmail: `other-${suffix}@example.test` } },
      },
    });
    otherTenantId = other.id;

    const home = await prisma.cmsPage.create({
      data: {
        tenantId,
        slug: 'home',
        title: 'Início',
        seoTitle: 'Empresa Site',
        seoDescription: 'Site da Empresa Site.',
        draftBlocks: HOME_BLOCKS,
        showInNav: false,
        isSystem: true,
      },
    });
    const version = await prisma.cmsVersion.create({
      data: {
        tenantId,
        pageId: home.id,
        version: 1,
        title: home.title,
        seoTitle: home.seoTitle,
        seoDescription: home.seoDescription,
        blocks: HOME_BLOCKS,
      },
    });
    await prisma.cmsPage.update({
      where: { id: home.id },
      data: { publishedVersionId: version.id, publishedAt: new Date() },
    });

    const services = await prisma.cmsPage.create({
      data: {
        tenantId,
        slug: 'servicos',
        title: 'Serviços',
        draftBlocks: [{ type: 'text', title: 'Serviços', body: 'Instalação.' }],
        showInNav: true,
        sortOrder: 1,
      },
    });
    const servicesVersion = await prisma.cmsVersion.create({
      data: {
        tenantId,
        pageId: services.id,
        version: 1,
        title: services.title,
        blocks: [
          { type: 'text', title: 'Serviços', body: 'Instalação e manutenção.' },
        ],
      },
    });
    await prisma.cmsPage.update({
      where: { id: services.id },
      data: {
        publishedVersionId: servicesVersion.id,
        publishedAt: new Date(),
      },
    });

    await prisma.faqItem.create({
      data: {
        tenantId,
        question: 'Qual a região atendida?',
        answer: 'São Paulo e região.',
      },
    });
    await prisma.legalDocument.create({
      data: {
        tenantId,
        slug: 'privacidade',
        version: 1,
        title: 'Política de Privacidade',
        body: 'Política de teste para o formulário público.',
      },
    });

    const [adminUser, installerUser] = await Promise.all([
      prisma.user.create({
        data: { email: adminEmail, name: 'Admin Site', passwordHash },
      }),
      prisma.user.create({
        data: { email: installerEmail, name: 'Instalador Site', passwordHash },
      }),
    ]);
    userIds = [adminUser.id, installerUser.id];
    await prisma.membership.createMany({
      data: [
        { tenantId, userId: adminUser.id, role: 'ADMIN' },
        { tenantId, userId: installerUser.id, role: 'INSTALLER' },
      ],
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantId, otherTenantId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it('expõe o site publicado pelo host', async () => {
    const response = await request(server)
      .get('/public/v1/site')
      .set('x-tenant-host', host)
      .expect(200);

    expect(response.body.tenant.slug).toBe(`site-${suffix}`);
    expect(response.body.identity.title).toBe('Empresa Site Climatização');
    expect(response.body.home.title).toBe('Início');
    expect(response.body.navigation).toEqual([
      { slug: 'servicos', title: 'Serviços' },
    ]);
    expect(response.body.faq).toHaveLength(1);
    expect(response.body.legal.privacy.version).toBe(1);
  });

  it('serve página publicada e documento legal', async () => {
    const page = await request(server)
      .get('/public/v1/pages/servicos')
      .set('x-tenant-host', host)
      .expect(200);
    expect(page.body.page.blocks[0].body).toBe('Instalação e manutenção.');

    const legal = await request(server)
      .get('/public/v1/legal/privacidade')
      .set('x-tenant-host', host)
      .expect(200);
    expect(legal.body.document.title).toBe('Política de Privacidade');
  });

  it('rejeita lead sem consentimento', async () => {
    const response = await request(server)
      .post('/public/v1/leads')
      .set('x-tenant-host', host)
      .set('idempotency-key', randomUUID())
      .set('x-forwarded-for', '10.0.0.1')
      .send(leadPayload({ consent: false }))
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('descarta automaticamente envio de honeypot', async () => {
    const response = await request(server)
      .post('/public/v1/leads')
      .set('x-tenant-host', host)
      .set('idempotency-key', randomUUID())
      .set('x-forwarded-for', '10.0.0.1')
      .send(leadPayload({ website: 'https://spam.example' }))
      .expect(201);

    expect(response.body.protocol).toBe('RECEBIDO');
    const count = await prisma.lead.count({ where: { tenantId } });
    expect(count).toBe(0);
  });

  it('grava lead, consentimento e outbox, com idempotência', async () => {
    const key = randomUUID();
    const payload = leadPayload();

    const first = await request(server)
      .post('/public/v1/leads')
      .set('x-tenant-host', host)
      .set('idempotency-key', key)
      .set('x-forwarded-for', '10.0.0.3')
      .send(payload)
      .expect(201);

    expect(first.body.protocol).toMatch(/^LD-\d{4}-\d{5}$/);
    expect(first.body.duplicate).toBe(false);

    const second = await request(server)
      .post('/public/v1/leads')
      .set('x-tenant-host', host)
      .set('idempotency-key', key)
      .set('x-forwarded-for', '10.0.0.3')
      .send(payload)
      .expect(201);

    expect(second.body.protocol).toBe(first.body.protocol);
    expect(second.body.duplicate).toBe(true);

    const lead = await prisma.lead.findFirstOrThrow({
      where: { tenantId, protocol: first.body.protocol },
      include: { consent: true, events: true },
    });
    expect(lead.consent?.policyVersion).toBe(1);
    expect(lead.consent?.text).toContain('Política de Privacidade');
    expect(lead.events).toHaveLength(1);

    const outbox = await prisma.outbox.findFirstOrThrow({
      where: { tenantId, template: 'LEAD_NOTIFICATION' },
    });
    expect(['PENDING', 'SENT']).toContain(outbox.status);

    await app.get(OutboxService).processTenant(tenantId);
    const sent = await prisma.outbox.findUniqueOrThrow({
      where: { id: outbox.id },
    });
    expect(sent.status).toBe('SENT');
    expect(sent.providerMessageId).toContain('dev-');
  });

  it('limita a criação de leads por IP e tenant', async () => {
    for (let index = 0; index < 5; index += 1) {
      await request(server)
        .post('/public/v1/leads')
        .set('x-tenant-host', host)
        .set('idempotency-key', randomUUID())
        .set('x-forwarded-for', '10.0.0.4')
        .send(leadPayload())
        .expect(201);
    }

    const blocked = await request(server)
      .post('/public/v1/leads')
      .set('x-tenant-host', host)
      .set('idempotency-key', randomUUID())
      .set('x-forwarded-for', '10.0.0.4')
      .send(leadPayload())
      .expect(429);

    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });

  it('permite ao admin listar e movimentar leads do próprio tenant', async () => {
    const agent = request.agent(server);
    await agent
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: PASSWORD })
      .expect(200);

    const list = await agent.get('/v1/leads').expect(200);
    expect(list.body.items.length).toBeGreaterThan(0);

    const lead = list.body.items[0];
    const updated = await agent
      .patch(`/v1/leads/${lead.id}`)
      .send({ status: 'CONTACTED', note: 'Primeiro contato' })
      .expect(200);
    expect(updated.body.status).toBe('CONTACTED');
    expect(updated.body.firstResponseAt).toBeTruthy();
    expect(updated.body.events.at(-1)).toMatchObject({
      type: 'STATUS_CHANGED',
      fromStatus: 'NEW',
      toStatus: 'CONTACTED',
    });

    const note = await agent
      .post(`/v1/leads/${lead.id}/notes`)
      .send({ note: 'Cliente pediu retorno à tarde.' })
      .expect(201);
    expect(note.body.events.at(-1).type).toBe('NOTE');
  });

  it('isola leads entre tenants e bloqueia instalador', async () => {
    const agent = request.agent(server);
    await agent
      .post('/v1/auth/login')
      .send({ email: installerEmail, password: PASSWORD })
      .expect(200);
    await agent.get('/v1/leads').expect(403);

    const adminAgent = request.agent(server);
    await adminAgent
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: PASSWORD })
      .expect(200);
    const list = await adminAgent.get('/v1/leads').expect(200);
    expect(
      list.body.items.every((item: { id: string }) => item.id !== undefined),
    ).toBe(true);
    expect(
      list.body.items.some((item: { name: string }) => item.name === 'Outro'),
    ).toBe(false);
  });

  it('publica alteração de CMS e permite reverter versão', async () => {
    const agent = request.agent(server);
    await agent
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: PASSWORD })
      .expect(200);

    const updated = await agent
      .put('/v1/cms/pages/servicos/draft')
      .send({
        title: 'Serviços e soluções',
        blocks: [
          { type: 'text', title: 'Novo título', body: 'Conteúdo novo.' },
        ],
      })
      .expect(200);
    expect(updated.body.title).toBe('Serviços e soluções');

    const published = await agent
      .post('/v1/cms/pages/servicos/publish')
      .expect(201);
    expect(published.body.versions.length).toBe(2);

    const publicPage = await request(server)
      .get('/public/v1/pages/servicos')
      .set('x-tenant-host', host)
      .expect(200);
    expect(publicPage.body.page.title).toBe('Serviços e soluções');

    const oldVersion = published.body.versions.find(
      (version: { version: number }) => version.version === 1,
    );
    const reverted = await agent
      .post('/v1/cms/pages/servicos/revert')
      .send({ versionId: oldVersion.id })
      .expect(201);
    expect(reverted.body.versions.length).toBe(3);

    const revertedPublic = await request(server)
      .get('/public/v1/pages/servicos')
      .set('x-tenant-host', host)
      .expect(200);
    expect(revertedPublic.body.page.title).toBe('Serviços');
  });
});

function leadPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Maria Cliente',
    whatsapp: '(11) 99999-9999',
    email: 'maria@example.test',
    city: 'São Paulo',
    neighborhood: 'Pinheiros',
    serviceType: 'Instalação',
    equipmentCount: 2,
    btu: 12000,
    notes: 'Apartamento no segundo andar.',
    consent: true,
    utm: { source: 'google', campaign: 'teste' },
    ...overrides,
  };
}
