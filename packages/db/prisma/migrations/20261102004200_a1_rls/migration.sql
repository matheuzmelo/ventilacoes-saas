-- Conteúdo do site, leads e outbox isolados por tenant.
ALTER TABLE "cms_pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cms_pages" FORCE ROW LEVEL SECURITY;
CREATE POLICY cms_pages_isolation ON "cms_pages"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

ALTER TABLE "cms_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cms_versions" FORCE ROW LEVEL SECURITY;
CREATE POLICY cms_versions_isolation ON "cms_versions"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

ALTER TABLE "faq_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "faq_items" FORCE ROW LEVEL SECURITY;
CREATE POLICY faq_items_isolation ON "faq_items"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

ALTER TABLE "legal_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "legal_documents" FORCE ROW LEVEL SECURITY;
CREATE POLICY legal_documents_isolation ON "legal_documents"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" FORCE ROW LEVEL SECURITY;
CREATE POLICY leads_isolation ON "leads"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consents" FORCE ROW LEVEL SECURITY;
CREATE POLICY consents_isolation ON "consents"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

ALTER TABLE "lead_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY lead_events_isolation ON "lead_events"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

ALTER TABLE "outbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outbox" FORCE ROW LEVEL SECURITY;
CREATE POLICY outbox_isolation ON "outbox"
  FOR ALL TO app_rw
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());
