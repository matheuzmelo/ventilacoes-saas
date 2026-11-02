import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CmsBlocks } from '@/components/cms-blocks';
import { getSite, getSitePage } from '@/lib/api';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getSitePage(slug);
  if (!payload) {
    return { title: 'Página não encontrada' };
  }

  return {
    title: payload.page.seoTitle ?? payload.page.title,
    description: payload.page.seoDescription ?? undefined,
    openGraph: {
      title: payload.page.seoTitle ?? payload.page.title,
      description: payload.page.seoDescription ?? undefined,
      type: 'website',
    },
  };
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;
  const [payload, site] = await Promise.all([getSitePage(slug), getSite()]);

  if (!payload) {
    notFound();
  }

  const hasHero = payload.page.blocks[0]?.type === 'hero';

  return (
    <main>
      {hasHero ? null : (
        <section className="border-b border-line bg-surface py-12">
          <div className="mx-auto max-w-6xl px-6">
            <h1 className="text-3xl font-semibold md:text-4xl">
              {payload.page.title}
            </h1>
            {payload.page.seoDescription ? (
              <p className="mt-3 max-w-2xl text-muted">
                {payload.page.seoDescription}
              </p>
            ) : null}
          </div>
        </section>
      )}
      <CmsBlocks
        blocks={payload.page.blocks}
        faq={payload.faq}
        privacy={site?.legal.privacy ?? null}
      />
    </main>
  );
}
