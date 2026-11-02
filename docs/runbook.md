# Runbook

## Ambiente local

1. `cp .env.example .env` e ajuste os segredos se necessário.
2. `pnpm install`.
3. `pnpm infra:up` (Postgres em `localhost:5433`, Mailpit em `localhost:8025`).
4. `pnpm db:deploy`.
5. `pnpm db:seed`.
6. `pnpm dev`.

O Postgres local usa a porta **5433** para não conflitar com outras instâncias.
As URLs em `.env` já apontam para ela. Em CI/produção use a porta padrão.

MinIO está no profile `storage` do Compose. As imagens oficiais exigem acesso
autenticado ao registry; habilite quando o registry estiver configurado:

```bash
docker compose -f infra/compose/dev.yml --profile storage up -d
```

## Acessos de demonstração

- Site: `http://localhost:3000` (tenant `demo`)
- Site alternativo: `http://demo2.lvh.me:3000` (tenant `demo2`)
- Login: `http://localhost:3000/login`
- Mailpit: `http://localhost:8025`
- API: `http://localhost:3001/health`

Senha do seed: `SenhaForte123!`.

## Verificações úteis

```bash
# migrations aplicadas
pnpm --filter @vs/db run deploy

# RLS ativo
docker exec vs-postgres psql -U app_migrator -d ventilacoes -c \
  "SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname IN ('audit_logs','memberships','tenant_settings','leads','cms_pages','outbox');"

# policies
docker exec vs-postgres psql -U app_migrator -d ventilacoes -c \
  "SELECT tablename, policyname, cmd FROM pg_policies ORDER BY tablename, policyname;"

# grants do runtime
docker exec vs-postgres psql -U app_migrator -d ventilacoes -c \
  "SELECT table_name, string_agg(privilege_type, ',') FROM information_schema.role_table_grants WHERE grantee='app_rw' GROUP BY table_name ORDER BY table_name;"
```

## Testes

`pnpm test` executa os testes de integração do `@vs/api` contra o Postgres
local. Eles criam tenants isolados, validam RLS, login, rotação de refresh token,
autorização por permissão, site/CMS, leads, consentimento, idempotência e
outbox. O banco precisa estar no ar com as migrations aplicadas; o seed não é
obrigatório para os testes.

## Site e leads (A1)

- Site público: `/`, páginas do menu (`/servicos`, `/sobre`, `/faq`,
  `/contato`), `/privacidade`, `/termos`, `/sitemap.xml` e `/robots.txt`.
- Formulário público: `POST /api/public/v1/leads` (same-origin). Exige
  `consent: true`; o honeypot `website` deve permanecer vazio; aceita
  `Idempotency-Key`. Limite padrão: 5 leads por hora por tenant + IP.
- Admin: `/admin/leads`, `/admin/conteudo`, `/admin/conteudo/faq`,
  `/admin/conteudo/legal`, `/admin/configuracoes` e `/admin/mensagens`.
- E-mails: em desenvolvimento, sem `RESEND_API_KEY`, o outbox marca `SENT` e
  imprime o conteúdo no console da API. Verifique a aba Mailpit quando a chave
  estiver configurada.

## Migrations

Para alterar o schema:

```bash
pnpm --filter @vs/db exec prisma migrate dev --name descricao --create-only
# revise o SQL e, se houver nova tabela de negócio, acrescente RLS/policies
pnpm db:deploy
```

Nunca edite uma migration já aplicada. Crie uma nova.

## Produção (checklist)

- Criar `app_migrator` com `BYPASSRLS` (ou superuser controlado) e `app_rw` com
  `NOBYPASSRLS`; nunca usar `app_migrator` na API.
- Definir segredos fortes para JWT e `ENCRYPTION_KEY` (32 bytes).
- Servir web e API no **mesmo site** via Caddy (`/api` → API). O cookie é
  `HttpOnly`, `SameSite=Lax` e `Secure` em produção; com domínios distintos
  para web e API, o login por cookie não funciona em domínios de clientes.
  Em desenvolvimento o CORS aceita qualquer origem; em produção ele usa
  `WEB_URL`. Use `NEXT_PUBLIC_API_URL=/api` no browser e `API_URL` com o
  endereço interno da API para o servidor do Next.
- Configurar Resend, Mercado Pago e MinIO antes das etapas que os utilizam.
- Backup do Postgres, logs com `correlation_id` e alerta de erro 5xx.
- Rodar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` no CI antes do
  deploy.
