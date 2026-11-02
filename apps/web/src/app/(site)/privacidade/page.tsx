import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLegalDocument } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getLegalDocument('privacidade');
  return {
    title: data?.document.title ?? 'Política de Privacidade',
    description: data?.document.title,
  };
}

export default async function PrivacyPage() {
  const data = await getLegalDocument('privacidade');
  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-semibold">{data.document.title}</h1>
      <p className="mt-2 text-sm text-muted">
        Versão {data.document.version} · Vigente desde{' '}
        {formatDate(data.document.effectiveAt)}
      </p>
      <article className="mt-8 space-y-4 text-muted">
        {data.document.body
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
      </article>
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}
