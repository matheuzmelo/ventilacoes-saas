import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@vs/ui';
import { CmsBlocks } from '@/components/cms-blocks';
import { getSite } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  if (!site) {
    return { title: 'Site não configurado' };
  }

  const page = site.home;
  const title = page?.seoTitle ?? page?.title ?? site.identity.title;
  const description = page?.seoDescription ?? site.identity.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: site.identity.title,
    },
  };
}

export default async function SitePage() {
  const site = await getSite();

  if (!site) {
    return (
      <main className="grid min-h-[60vh] place-items-center p-6">
        <Card className="w-full max-w-md">
          <h1 className="text-xl font-semibold">Site não configurado</h1>
          <p className="mt-2 text-sm text-muted">
            Este domínio ainda não está associado a uma empresa.
          </p>
          <Link href="/login" className="vs-btn vs-btn--primary mt-6">
            Entrar no painel
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main>
      {site.home ? (
        <CmsBlocks
          blocks={site.home.blocks}
          faq={site.faq}
          privacy={site.legal.privacy}
        />
      ) : (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl font-semibold">{site.identity.title}</h1>
          <p className="mt-4 max-w-2xl text-muted">
            {site.identity.description}
          </p>
          <Link href="/contato" className="vs-btn vs-btn--primary mt-8">
            Solicitar orçamento
          </Link>
        </section>
      )}
      <JsonLd site={site} />
    </main>
  );
}

function JsonLd({ site }: { site: NonNullable<Awaited<ReturnType<typeof getSite>>> }) {
  const sameAs = [
    site.identity.instagramUrl,
    site.identity.facebookUrl,
    site.identity.googleBusinessUrl,
  ].filter(Boolean);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    name: site.identity.title,
    description: site.identity.description,
    ...(site.identity.phone ? { telephone: site.identity.phone } : {}),
    ...(site.identity.contactEmail
      ? { email: site.identity.contactEmail }
      : {}),
    ...(site.identity.address ? { address: site.identity.address } : {}),
    ...(site.identity.serviceAreas.length > 0
      ? { areaServed: site.identity.serviceAreas }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
