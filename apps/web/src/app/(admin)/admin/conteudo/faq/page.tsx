import Link from 'next/link';
import { PageTitle } from '@vs/ui';
import { getAdminFaq } from '@/lib/api';
import { FaqManager } from '@/components/admin/faq-manager';

export const dynamic = 'force-dynamic';

export default async function FaqAdminPage() {
  const items = await getAdminFaq();

  return (
    <>
      <PageTitle
        title="Perguntas frequentes"
        description="As perguntas publicadas aparecem no bloco de FAQ do site."
        action={
          <Link href="/admin/conteudo" className="vs-btn vs-btn--ghost">
            Voltar
          </Link>
        }
      />
      <FaqManager initialItems={items} />
    </>
  );
}
