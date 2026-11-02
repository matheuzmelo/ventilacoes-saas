import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@vs/ui';

export const metadata: Metadata = {
  title: 'Solicitação recebida',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ protocol?: string }>;
};

export default async function ThankYouPage({ searchParams }: PageProps) {
  const { protocol } = await searchParams;

  return (
    <main className="grid min-h-[60vh] place-items-center px-6 py-16">
      <Card className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold">Solicitação recebida</h1>
        <p className="mt-3 text-muted">
          Seus dados foram enviados para a equipe. O contato será feito pelo
          WhatsApp informado, normalmente em até 1 dia útil.
        </p>
        {protocol ? (
          <p className="mt-4 rounded-md bg-[#eef7ff] px-3 py-2 text-sm">
            Protocolo: <strong>{protocol}</strong>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="vs-btn vs-btn--primary">
            Voltar ao site
          </Link>
          <Link href="/contato" className="vs-btn vs-btn--secondary">
            Enviar outra solicitação
          </Link>
        </div>
      </Card>
    </main>
  );
}
