import Link from 'next/link';
import { PageTitle } from '@vs/ui';
import { getAdminLegal } from '@/lib/api';
import { LegalManager } from '@/components/admin/legal-manager';

export const dynamic = 'force-dynamic';

export default async function LegalAdminPage() {
  const documents = await getAdminLegal();

  return (
    <>
      <PageTitle
        title="Políticas e termos"
        description="Publique versões e mantenha o histórico dos documentos legais."
        action={
          <Link href="/admin/conteudo" className="vs-btn vs-btn--ghost">
            Voltar
          </Link>
        }
      />
      <LegalManager initialDocuments={documents} />
    </>
  );
}
