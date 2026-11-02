import Link from 'next/link';
import type { SitePayload } from '@vs/shared';

export function SiteFooter({ site }: { site: SitePayload | null }) {
  if (!site) {
    return null;
  }

  const { identity } = site;

  return (
    <footer className="border-t border-line bg-surface py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
        <div>
          <p className="font-semibold">{identity.title}</p>
          <p className="mt-2 text-sm text-muted">{identity.description}</p>
          {identity.address ? (
            <p className="mt-3 text-sm text-muted">{identity.address}</p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold">Contato</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {identity.phone ? <li>Telefone: {identity.phone}</li> : null}
            {identity.whatsapp ? <li>WhatsApp: {identity.whatsapp}</li> : null}
            {identity.contactEmail ? (
              <li>
                <a
                  href={`mailto:${identity.contactEmail}`}
                  className="hover:text-ink"
                >
                  {identity.contactEmail}
                </a>
              </li>
            ) : null}
            {identity.serviceAreas.length > 0 ? (
              <li>Atendimento: {identity.serviceAreas.join(', ')}</li>
            ) : null}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Informações</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>
              <Link href="/privacidade" className="hover:text-ink">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link href="/termos" className="hover:text-ink">
                Termos de Uso
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-ink">
                Área da empresa
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-6 text-xs text-muted">
        © {new Date().getFullYear()} {site.tenant.name}. Todos os direitos
        reservados.
      </div>
    </footer>
  );
}
