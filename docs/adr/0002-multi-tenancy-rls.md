# ADR 0002 — Isolamento multi-tenant com RLS

## Status

Aceito.

## Contexto

Cada prestador é um tenant com dados próprios. Um erro de filtro em uma query
não pode expor dados de outra empresa. A aplicação é self-hosted e o banco é
compartilhado.

## Decisão

- `tenant_id` em todas as tabelas de negócio.
- RLS habilitado com `FORCE ROW LEVEL SECURITY`.
- Dois papéis: `app_migrator` (migrations/seed, `BYPASSRLS`) e `app_rw`
  (runtime, `NOBYPASSRLS`).
- Contexto por transação via `set_config('app.tenant_id', ..., true)` e
  `set_config('app.user_id', ..., true)`, encapsulado em `TenantPrisma`.
- `memberships` tem uma policy de SELECT adicional para o próprio usuário,
  usada somente no login/refresh.
- Tabelas globais por necessidade de lookup antes do tenant: `tenants`,
  `tenant_domains`, `users`, `refresh_tokens`.

## Consequências

- Defesa em profundidade: mesmo uma query sem `WHERE tenant_id` fica restrita.
- Toda operação tenant-scoped precisa de transação e contexto.
- Testes de isolamento são obrigatórios.
- O papel de runtime não pode ser owner das tabelas.
