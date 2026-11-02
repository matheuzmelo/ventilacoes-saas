import Link from 'next/link';
import { Badge, Card, PageTitle } from '@vs/ui';
import { getAdminPages } from '@/lib/api';
import { CreatePageForm } from '@/components/admin/create-page-form';

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  const pages = await getAdminPages();

  return (
    <>
      <PageTitle
        title="Conteúdo do site"
        description="Edite páginas, publique versões e gerencie FAQ e documentos legais."
        action={
          <div className="flex gap-2">
            <Link href="/admin/conteudo/faq" className="vs-btn vs-btn--secondary">
              FAQ
            </Link>
            <Link
              href="/admin/conteudo/legal"
              className="vs-btn vs-btn--secondary"
            >
              Políticas
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Página</th>
                  <th className="px-4 py-3">Menu</th>
                  <th className="px-4 py-3">Publicação</th>
                  <th className="px-4 py-3">Versões</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/conteudo/${page.slug}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {page.title}
                      </Link>
                      <p className="text-xs text-muted">/{page.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {page.showInNav ? (
                        <Badge tone="success">Sim</Badge>
                      ) : (
                        <Badge>Não</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {page.publishedVersionId ? (
                        <Badge tone="success">Publicada</Badge>
                      ) : (
                        <Badge tone="warning">Rascunho</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {page.versions.length}
                    </td>
                  </tr>
                ))}
                {pages.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-muted" colSpan={4}>
                      Nenhuma página cadastrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <Card>
          <h2 className="text-lg font-semibold">Nova página</h2>
          <p className="mt-2 text-sm text-muted">
            Crie uma página e edite o conteúdo antes de publicar.
          </p>
          <CreatePageForm />
        </Card>
      </div>
    </>
  );
}
