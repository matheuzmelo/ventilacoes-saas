-- Funções auxiliares: leem configurações definidas por transação em TenantPrisma.
CREATE OR REPLACE FUNCTION app_current_tenant_id() RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

-- tenant_settings
ALTER TABLE "tenant_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_settings" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_settings_isolation ON "tenant_settings"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

-- memberships
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
CREATE POLICY memberships_isolation ON "memberships"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());
-- Permite ao fluxo de login listar apenas os vínculos do próprio usuário,
-- ainda sem tenant definido na transação.
CREATE POLICY memberships_self_select ON "memberships"
  FOR SELECT TO app_rw
  USING (user_id = app_current_user_id());

-- invites
ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invites" FORCE ROW LEVEL SECURITY;
CREATE POLICY invites_isolation ON "invites"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

-- audit_logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_isolation ON "audit_logs"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

-- files
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "files" FORCE ROW LEVEL SECURITY;
CREATE POLICY files_isolation ON "files"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

-- tenant_counters
ALTER TABLE "tenant_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_counters" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_counters_isolation ON "tenant_counters"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

-- payment_accounts
ALTER TABLE "payment_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_accounts" FORCE ROW LEVEL SECURITY;
CREATE POLICY payment_accounts_isolation ON "payment_accounts"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

-- Tabelas globais (sem RLS) por necessidade de lookup antes do tenant:
-- tenants, tenant_domains, users e refresh_tokens.
