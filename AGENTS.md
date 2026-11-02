# AGENTS.md

## Projeto

SaaS multi-tenant de site e gestão para prestadores de climatização. O escopo
vigente é a **Fase A** descrita em
`Especificação Técnica — Site e Gestão para Prestadores de Climatização (Fase A).md`.
O documento `ESPECIFICACAO_TECNICA_SAAS_GESTAO_CLIMATIZACAO.md` é referência de
engenharia e backlog da Fase B; não implemente itens da Fase B sem pedido
explícito.

## Stack

- Monorepo pnpm: `apps/api` (NestJS 12), `apps/web` (Next.js 15 App Router).
- Pacotes: `packages/shared`, `packages/db` (Prisma 7), `packages/ui`,
  `packages/emails`.
- PostgreSQL 16 com RLS. Runtime usa o papel `app_rw`; migrations/seed usam
  `app_migrator`.
- Autenticação própria: access token JWT curto em cookie HttpOnly + refresh
  token opaco com rotação e revogação.

## Comandos

```bash
pnpm install
pnpm infra:up          # Postgres (localhost:5433) + Mailpit
pnpm db:deploy         # aplica migrations pendentes
pnpm db:seed           # tenants demo e usuários de teste
pnpm dev               # API :3001 e web :3000
pnpm lint
pnpm typecheck
pnpm test              # inclui testes de integração/RLS no @vs/api
pnpm build
```

Credenciais do seed: senha `SenhaForte123!` para
`admin@demo.test`, `instalador@demo.test`, `admin@demo2.test` e
`instalador@demo2.test`.

## Invariantes

- O tenant **nunca** é aceito do corpo da requisição. Ele vem do host
  (`tenant_domains`) ou do token autenticado.
- Toda operação em tabela com `tenant_id` deve passar por `TenantPrisma.run`
  (ou `runAsUser` no fluxo de login/refresh).
- Rotas são protegidas por padrão. Use `@Public()` apenas quando necessário e
  `@RequirePermissions(...)` para autorização granular.
- Erros seguem o envelope `{ error: { code, message, correlationId, details? } }`.
- Não use o client de migrations no caminho de request.
- Segredos nunca entram no repositório; `.env` é local.

## Banco e RLS

- `packages/db/prisma/migrations/*_init` cria as tabelas.
- `packages/db/prisma/migrations/*_rls` habilita RLS e as policies.
- Tabelas globais por necessidade de lookup antes do tenant: `tenants`,
  `tenant_domains`, `users`, `refresh_tokens`.
- Ao criar uma nova tabela de negócio, adicione `tenant_id`, RLS
  (`ENABLE` + `FORCE`), policy de isolamento e um teste no `@vs/api`.

## Convenções

- TypeScript estrito; sem `any` gratuito.
- Não adicione comentários no código, exceto quando explicarem uma regra não
  óbvia (ex.: policy de RLS).
- UI em português, valores monetários com `decimal.js` de `@vs/shared`.
- Datas armazenadas em UTC; timezone de exibição vem de `tenant_settings`.
