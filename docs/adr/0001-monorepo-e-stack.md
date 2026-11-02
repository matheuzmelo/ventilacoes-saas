# ADR 0001 — Monorepo pnpm com Next.js, NestJS e Prisma

## Status

Aceito.

## Contexto

O produto combina site público, painel administrativo, área do instalador, API
multi-tenant e bibliotecas compartilhadas. Precisamos de contratos únicos entre
front-end e back-end e de evolução independente dos pacotes.

## Decisão

- Monorepo pnpm com `apps/api`, `apps/web` e pacotes em `packages/*`.
- Next.js 15 (App Router) + React 19 no web.
- NestJS 12 no back-end.
- Prisma 7 + PostgreSQL 16.
- `@vs/shared` concentra tipos, permissões, erros, paginação e dinheiro.
- `@vs/ui` concentra tokens e componentes base.
- `@vs/emails` concentra templates transacionais.

## Consequências

- Build e lint únicos no CI.
- Menos duplicação de contratos.
- Exige disciplina de dependências entre pacotes e versionamento interno.
