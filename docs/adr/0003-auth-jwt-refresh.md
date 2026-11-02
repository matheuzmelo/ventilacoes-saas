# ADR 0003 — Autenticação própria com JWT curto e refresh rotativo

## Status

Aceito.

## Contexto

O produto é self-hosted, precisa funcionar sem dependência de provedor externo
de identidade e deve suportar dois papéis com permissões granulares.

## Decisão

- Login por e-mail/senha com Argon2id.
- Access token JWT de 15 minutos em cookie `HttpOnly` (`vs_access`), contendo
  `tenant_id`, `membership_id`, papel e permissões efetivas.
- Refresh token opaco de alta entropia, armazenado apenas como HMAC-SHA256
  (`vs_refresh`), com rotação a cada uso e revogação.
- Reutilização de refresh token revoga todos os tokens ativos do usuário.
- Autorização por `@RequirePermissions(...)`; `ADMIN` recebe todas as
  permissões, `INSTALLER` recebe apenas leitura de orçamento, leitura das
  próprias OS e execução de OS.
- `permission_overrides` (array JSON) permite ajustar permissões por vínculo.

## Consequências

- Sem dependência de provedor de identidade na Fase A.
- Logout real e revogação de sessão.
- O token de acesso continua válido por até 15 minutos após revogação; aceitável
  no escopo atual.
