import Link from 'next/link';
import { Badge, Card } from '@vs/ui';
import type { CmsBlock, SiteFaqItem, SiteLegalVersion } from '@vs/shared';
import { QuoteForm } from './quote-form';

interface CmsBlocksProps {
  blocks: CmsBlock[];
  faq: SiteFaqItem[];
  privacy: SiteLegalVersion | null;
}

export function CmsBlocks({ blocks, faq, privacy }: CmsBlocksProps) {
  return (
    <>
      {blocks.map((block, index) => (
        <Block
          key={`${block.type}-${index}`}
          block={block}
          faq={faq}
          privacy={privacy}
        />
      ))}
    </>
  );
}

function Block({
  block,
  faq,
  privacy,
}: {
  block: CmsBlock;
  faq: SiteFaqItem[];
  privacy: SiteLegalVersion | null;
}) {
  switch (block.type) {
    case 'hero':
      return (
        <section className="bg-gradient-to-b from-surface to-[#eef7ff]">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <Badge tone="success">Atendimento local</Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                {block.title}
              </h1>
              {block.subtitle ? (
                <p className="mt-5 max-w-xl text-lg text-muted">
                  {block.subtitle}
                </p>
              ) : null}
              {block.ctaLabel && block.ctaHref ? (
                <div className="mt-8">
                  <ActionLink
                    href={block.ctaHref}
                    label={block.ctaLabel}
                    primary
                  />
                </div>
              ) : null}
            </div>
            {block.imageUrl ? (
              <img
                src={block.imageUrl}
                alt=""
                className="w-full rounded-lg border border-line object-cover"
              />
            ) : (
              <Card>
                <p className="text-sm font-semibold text-brand">Como funciona</p>
                <ol className="mt-4 space-y-4 text-sm text-muted">
                  <li>
                    <strong className="text-ink">1. Você conta o que precisa</strong>
                    <br />
                    Ambiente, equipamento e principais dificuldades.
                  </li>
                  <li>
                    <strong className="text-ink">2. Recebe uma estimativa</strong>
                    <br />
                    Com faixa de preço e próximos passos combinados.
                  </li>
                  <li>
                    <strong className="text-ink">3. Agenda o atendimento</strong>
                    <br />
                    Data confirmada e técnico informado com antecedência.
                  </li>
                </ol>
              </Card>
            )}
          </div>
        </section>
      );

    case 'text':
      return (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-3xl">
            {block.title ? (
              <h2 className="text-2xl font-semibold">{block.title}</h2>
            ) : null}
            <div className="mt-4 space-y-4 text-muted">
              {paragraphs(block.body).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      );

    case 'image':
      return (
        <section className="mx-auto max-w-6xl px-6 py-10">
          <figure>
            <img
              src={block.url}
              alt={block.alt}
              className="w-full rounded-lg border border-line object-cover"
            />
            {block.caption ? (
              <figcaption className="mt-2 text-sm text-muted">
                {block.caption}
              </figcaption>
            ) : null}
          </figure>
        </section>
      );

    case 'cta':
      return (
        <section className="bg-brand/10 py-14">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-2xl font-semibold">{block.title}</h2>
            {block.text ? (
              <p className="mt-2 text-muted">{block.text}</p>
            ) : null}
            <div className="mt-6">
              <ActionLink href={block.href} label={block.label} primary />
            </div>
          </div>
        </section>
      );

    case 'services':
      return (
        <section className="mx-auto max-w-6xl px-6 py-14">
          {block.title ? (
            <h2 className="text-2xl font-semibold">{block.title}</h2>
          ) : null}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {block.items.map((service) => (
              <Card key={service.title}>
                <h3 className="font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm text-muted">
                  {service.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section className="mx-auto max-w-6xl px-6 py-14">
          {block.title ? (
            <h2 className="text-2xl font-semibold">{block.title}</h2>
          ) : null}
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {block.items.map((item) => (
              <Card key={`${item.name}-${item.text.slice(0, 16)}`}>
                <p className="text-sm text-muted">“{item.text}”</p>
                <p className="mt-3 text-sm font-semibold">{item.name}</p>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="text-2xl font-semibold">
            {block.title ?? 'Perguntas frequentes'}
          </h2>
          {block.text ? <p className="mt-2 text-muted">{block.text}</p> : null}
          <div className="mt-6 space-y-3">
            {faq.map((item) => (
              <details
                key={item.id}
                className="rounded-lg border border-line bg-surface p-4"
              >
                <summary className="cursor-pointer font-medium">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-muted">{item.answer}</p>
              </details>
            ))}
            {faq.length === 0 ? (
              <p className="text-sm text-muted">
                Nenhuma pergunta publicada no momento.
              </p>
            ) : null}
          </div>
        </section>
      );

    case 'contact':
      return (
        <section id="contato" className="bg-surface py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-semibold">
              {block.title ?? 'Solicite seu orçamento'}
            </h2>
            <p className="mt-2 text-muted">
              {block.text ??
                'Preencha os dados abaixo. A equipe responde pelo WhatsApp informado.'}
            </p>
            <div className="mt-6">
              <QuoteForm privacy={privacy} />
            </div>
          </div>
        </section>
      );
  }
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  const className = primary
    ? 'vs-btn vs-btn--primary'
    : 'vs-btn vs-btn--secondary';

  if (/^https?:\/\//.test(href) || href.startsWith('mailto:')) {
    return (
      <a
        href={href}
        className={className}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function paragraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
