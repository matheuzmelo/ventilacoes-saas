import Link from 'next/link';
import { PageTitle } from '@vs/ui';
import { getTenantSettings } from '@/lib/api';
import { SiteSettingsForm } from '@/components/admin/site-settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const payload = await getTenantSettings();

  return (
    <>
      <PageTitle
        title="Configurações do site"
        description="Identidade, contato e canais exibidos no site público."
        action={
          <Link href="/admin" className="vs-btn vs-btn--ghost">
            Voltar
          </Link>
        }
      />
      <SiteSettingsForm initialSettings={payload?.settings ?? null} />
    </>
  );
}
