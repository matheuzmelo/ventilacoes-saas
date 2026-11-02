import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import {
  createAdminPrismaClient,
  type PrismaClient,
} from '@vs/db';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

const PASSWORD = 'SenhaForte123!';

function setCookies(response: request.Response): string[] {
  const raw = response.headers['set-cookie'] as unknown;
  if (Array.isArray(raw)) {
    return raw;
  }
  return typeof raw === 'string' ? [raw] : [];
}

function cookieValue(
  response: request.Response,
  name: string,
): string | undefined {
  const cookie = setCookies(response).find((value) =>
    value.startsWith(`${name}=`),
  );
  return cookie?.split(';')[0]?.slice(name.length + 1);
}

describe('Auth e isolamento (e2e)', () => {
  const suffix = randomUUID().slice(0, 8);
  const host = `e2e-${suffix}.lvh.me`;
  const adminEmail = `admin-${suffix}@example.test`;
  const installerEmail = `installer-${suffix}@example.test`;

  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let admin: PrismaClient;
  let tenantId: string;
  let userIds: string[] = [];

  beforeAll(async () => {
    admin = createAdminPrismaClient();
    await admin.$connect();

    const passwordHash = await hash(PASSWORD);
    const tenant = await admin.tenant.create({
      data: {
        slug: `e2e-${suffix}`,
        name: 'Empresa E2E',
        domains: { create: { host, isPrimary: true } },
        settings: { create: { timezone: 'America/Manaus' } },
      },
    });
    tenantId = tenant.id;

    const [adminUser, installerUser] = await Promise.all([
      admin.user.create({
        data: { email: adminEmail, name: 'Admin E2E', passwordHash },
      }),
      admin.user.create({
        data: { email: installerEmail, name: 'Instalador E2E', passwordHash },
      }),
    ]);
    userIds = [adminUser.id, installerUser.id];

    await admin.membership.createMany({
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
    await admin.tenant.deleteMany({ where: { id: tenantId } });
    await admin.user.deleteMany({ where: { id: { in: userIds } } });
    await admin.$disconnect();
  });

  it('resolve o tenant público pelo host', async () => {
    const response = await request(server)
      .get('/public/v1/tenant')
      .set('x-tenant-host', host)
      .expect(200);

    expect(response.body).toMatchObject({
      slug: `e2e-${suffix}`,
      name: 'Empresa E2E',
      timezone: 'America/Manaus',
    });
  });

  it('retorna 404 para host desconhecido', async () => {
    const response = await request(server)
      .get('/public/v1/tenant')
      .set('x-tenant-host', `unknown-${suffix}.lvh.me`)
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.correlationId).toBeTruthy();
  });

  it('rejeita senha incorreta com envelope padronizado', async () => {
    const response = await request(server)
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: 'senha-errada' })
      .expect(401);

    expect(response.body.error).toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'Credenciais inválidas',
    });
    expect(response.headers['x-correlation-id']).toBeTruthy();
  });

  it('autentica admin e acessa configurações do próprio tenant', async () => {
    const agent = request.agent(server);
    const login = await agent
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: PASSWORD, tenantSlug: `e2e-${suffix}` })
      .expect(200);

    expect(login.body.user).toMatchObject({
      email: adminEmail,
      tenantId,
      role: 'ADMIN',
    });
    expect(setCookies(login).some((c) => c.startsWith('vs_access='))).toBe(true);

    const me = await agent.get('/v1/auth/me').expect(200);
    expect(me.body.user.email).toBe(adminEmail);

    const settings = await agent.get('/v1/tenant/settings').expect(200);
    expect(settings.body.tenant.id).toBe(tenantId);
    expect(settings.body.settings.timezone).toBe('America/Manaus');

    const tenant = await agent.get('/v1/tenant').expect(200);
    expect(tenant.body.tenant.id).toBe(tenantId);
    expect(tenant.body.settings.timezone).toBe('America/Manaus');
  });

  it('bloqueia instalador em rota administrativa', async () => {
    const agent = request.agent(server);
    await agent
      .post('/v1/auth/login')
      .send({ email: installerEmail, password: PASSWORD })
      .expect(200);

    const response = await agent.get('/v1/tenant/settings').expect(403);
    expect(response.body.error.code).toBe('FORBIDDEN');

    const tenant = await agent.get('/v1/tenant').expect(200);
    expect(tenant.body.tenant.id).toBe(tenantId);
    expect(tenant.body.settings).toBeNull();
  });

  it('rotaciona refresh token e detecta reutilização', async () => {
    const agent = request.agent(server);
    const login = await agent
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: PASSWORD })
      .expect(200);

    const firstRefresh = cookieValue(login, 'vs_refresh');
    expect(firstRefresh).toBeTruthy();

    const refreshed = await agent.post('/v1/auth/refresh').expect(200);
    const secondRefresh = cookieValue(refreshed, 'vs_refresh');
    expect(secondRefresh).toBeTruthy();
    expect(secondRefresh).not.toBe(firstRefresh);

    await request(server)
      .post('/v1/auth/refresh')
      .set('Cookie', `vs_refresh=${firstRefresh}`)
      .expect(401);

    await agent.post('/v1/auth/refresh').expect(401);
  });

  it('encerra a sessão ao sair', async () => {
    const agent = request.agent(server);
    await agent
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: PASSWORD })
      .expect(200);

    await agent.get('/v1/auth/me').expect(200);
    await agent.post('/v1/auth/logout').expect(200);
    await agent.get('/v1/auth/me').expect(401);
  });
});
