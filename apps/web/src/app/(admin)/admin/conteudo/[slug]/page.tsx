import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageTitle } from '@vs/ui';
import { getAdminPage } from '@/lib/api';
import { CmsPageEditor } from '@/components/admin/cms-page-editor';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export default async function EditCmsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getAdminPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      <PageTitle
        title={`Editar ${page.title}`}
        description={`Página /${page.slug}`}
        action={
          <Link href="/admin/conteudo" className="vs-btn vs-btn--ghost">
            Voltar
          </Link>
        }
      />
      <CmsPageEditor page={page} />
    </>
  );
}
