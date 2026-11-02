import Link from 'next/link';
import type { SitePayload } from '@vs/shared';

export function whatsappHref(site: SitePayload): string | null {
  if (!site.identity.whatsapp) {
    return null;
  }
  const digits = site.identity.whatsapp.replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  const text = encodeURIComponent(
    site.identity.whatsappMessage ?? 'Olá! Gostaria de solicitar um orçamento.',
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export function SiteHeader({ site }: { site: SitePayload | null }) {
  if (!site) {
    return (
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-semibold">Climatização</span>
          <Link href="/login" className="text-sm text-brand hover:underline">
            Entrar
          </Link>
        </div>
      </header>
    );
  }

  const whatsapp = whatsappHref(site);

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          {site.identity.logoUrl ? (
            <img
              src={site.identity.logoUrl}
              alt={site.identity.title}
              className="h-10 w-auto"
            />
          ) : null}
          <span className="text-lg font-semibold">{site.identity.title}</span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="flex flex-wrap items-center gap-4 text-sm text-muted"
        >
          <Link href="/" className="hover:text-ink">
            Início
          </Link>
          {site.navigation.map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className="hover:text-ink"
            >
              {item.title}
            </Link>
          ))}
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="vs-btn vs-btn--primary !min-h-0 !px-4 !py-2 text-sm"
            >
              WhatsApp
            </a>
          ) : (
            <Link href="/contato" className="vs-btn vs-btn--primary !min-h-0 !px-4 !py-2 text-sm">
              Orçamento
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
