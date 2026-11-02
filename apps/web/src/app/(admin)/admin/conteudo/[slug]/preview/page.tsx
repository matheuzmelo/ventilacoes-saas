import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alert } from '@vs/ui';
import { getAdminFaq, getAdminPage } from '@/lib/api';
import { CmsBlocks } from '@/components/cms-blocks';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export default async function PreviewPage({ params }: PageProps) {
  const { slug } = await params;
  const [page, faq] = await Promise.all([getAdminPage(slug), getAdminFaq()]);

  if (!page) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Prévia</p>
          <h1 className="text-2xl font-semibold">{page.title}</h1>
          <p className="text-sm text-muted">
            Exibindo o rascunho atual, sem publicar.
          </p>
        </div>
        <Link
          href={`/admin/conteudo/${page.slug}`}
          className="vs-btn vs-btn--secondary"
        >
          Voltar ao editor
        </Link>
      </div>

      <Alert tone="info">
        Esta é a prévia do rascunho. O site público continua com a última versão
        publicada até você clicar em Publicar.
      </Alert>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        <CmsBlocks blocks={page.draftBlocks} faq={faq} privacy={null} />
      </div>
    </div>
  );
}
