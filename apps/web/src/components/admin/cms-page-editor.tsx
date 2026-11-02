'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from '@vs/ui';
import type {
  CmsBlock,
  CmsBlockType,
  CmsPageAdmin,
  CmsVersionView,
} from '@vs/shared';
import { formatDateTime } from '@/lib/format';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const BLOCK_LABELS: Record<CmsBlockType, string> = {
  hero: 'Destaque',
  text: 'Texto',
  image: 'Imagem',
  cta: 'Chamada para ação',
  services: 'Serviços',
  testimonials: 'Depoimentos',
  faq: 'Perguntas frequentes',
  contact: 'Formulário de contato',
};

export function CmsPageEditor({ page }: { page: CmsPageAdmin }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(
    page.seoDescription ?? '',
  );
  const [blocks, setBlocks] = useState<CmsBlock[]>(page.draftBlocks);
  const [showInNav, setShowInNav] = useState(page.showInNav);
  const [sortOrder, setSortOrder] = useState(String(page.sortOrder));
  const [newType, setNewType] = useState<CmsBlockType>('text');
  const [versionId, setVersionId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function applyPage(next: CmsPageAdmin) {
    setTitle(next.title);
    setSeoTitle(next.seoTitle ?? '');
    setSeoDescription(next.seoDescription ?? '');
    setBlocks(next.draftBlocks);
    setShowInNav(next.showInNav);
    setSortOrder(String(next.sortOrder));
    router.refresh();
  }

  async function saveDraft(showFeedback = true): Promise<boolean> {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/v1/cms/pages/${page.slug}/draft`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            seoTitle: seoTitle.trim(),
            seoDescription: seoDescription.trim(),
            blocks,
            showInNav,
            sortOrder: Number(sortOrder),
          }),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | (CmsPageAdmin & { error?: { message?: string } })
        | null;

      if (!response.ok || !body || body.error) {
        setError(body?.error?.message ?? 'Não foi possível salvar o rascunho.');
        return false;
      }

      applyPage(body);
      if (showFeedback) {
        setMessage('Rascunho salvo.');
      }
      return true;
    } catch {
      setError('Não foi possível conectar ao servidor.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    const saved = await saveDraft(false);
    if (!saved) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/v1/cms/pages/${page.slug}/publish`,
        { method: 'POST' },
      );
      const body = (await response.json().catch(() => null)) as
        | (CmsPageAdmin & { error?: { message?: string } })
        | null;

      if (!response.ok || !body || body.error) {
        setError(body?.error?.message ?? 'Não foi possível publicar.');
        return;
      }

      applyPage(body);
      setMessage('Página publicada.');
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function revert() {
    if (!versionId) {
      setError('Selecione uma versão para restaurar.');
      return;
    }
    if (!window.confirm('Restaurar esta versão como novo rascunho publicado?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `${API_URL}/v1/cms/pages/${page.slug}/revert`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ versionId }),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | (CmsPageAdmin & { error?: { message?: string } })
        | null;

      if (!response.ok || !body || body.error) {
        setError(body?.error?.message ?? 'Não foi possível restaurar.');
        return;
      }

      setVersionId('');
      applyPage(body);
      setMessage('Versão restaurada.');
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  function addBlock() {
    setBlocks((current) => [...current, createBlock(newType)]);
  }

  function updateBlock(index: number, next: CmsBlock) {
    setBlocks((current) =>
      current.map((block, position) => (position === index ? next : block)),
    );
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, position) => position !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      if (!item) {
        return current;
      }
      copy.splice(target, 0, item);
      return copy;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título da página" htmlFor="page-title">
              <Input
                id="page-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
              />
            </Field>
            <Field label="Ordem no menu" htmlFor="page-order">
              <Input
                id="page-order"
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </Field>
            <Field label="Título SEO" htmlFor="page-seo-title">
              <Input
                id="page-seo-title"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                maxLength={120}
              />
            </Field>
            <Field label="Descrição SEO" htmlFor="page-seo-description">
              <Input
                id="page-seo-description"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                maxLength={300}
              />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInNav}
              onChange={(event) => setShowInNav(event.target.checked)}
              className="h-4 w-4"
            />
            Exibir no menu do site
          </label>
        </Card>

        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Blocos da página</h2>
              <p className="text-sm text-muted">
                Monte a página com os blocos abaixo.
              </p>
            </div>
            <div className="flex items-end gap-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Novo bloco</span>
                <Select
                  value={newType}
                  onChange={(event) =>
                    setNewType(event.target.value as CmsBlockType)
                  }
                >
                  {Object.entries(BLOCK_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <Button type="button" variant="secondary" onClick={addBlock}>
                Adicionar
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {blocks.map((block, index) => (
              <div
                key={`${index}-${block.type}`}
                className="rounded-lg border border-line p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {index + 1}. {BLOCK_LABELS[block.type]}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="vs-btn vs-btn--ghost !min-h-0 !px-2 !py-1 text-xs"
                      onClick={() => moveBlock(index, -1)}
                      aria-label="Mover para cima"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="vs-btn vs-btn--ghost !min-h-0 !px-2 !py-1 text-xs"
                      onClick={() => moveBlock(index, 1)}
                      aria-label="Mover para baixo"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="vs-btn vs-btn--danger !min-h-0 !px-2 !py-1 text-xs"
                      onClick={() => removeBlock(index)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <BlockFields
                    block={block}
                    onChange={(next) => updateBlock(index, next)}
                  />
                </div>
              </div>
            ))}
            {blocks.length === 0 ? (
              <p className="text-sm text-muted">
                Nenhum bloco adicionado. A página ficará vazia.
              </p>
            ) : null}
          </div>
        </Card>

        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => void saveDraft()}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar rascunho'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void publish()}
            disabled={loading}
          >
            Publicar
          </Button>
          <Link
            href={`/admin/conteudo/${page.slug}/preview`}
            className="vs-btn vs-btn--ghost"
          >
            Pré-visualizar
          </Link>
          <Link href="/admin/conteudo" className="vs-btn vs-btn--ghost">
            Voltar
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold">Publicação</h2>
          <p className="mt-2 text-sm text-muted">
            {page.publishedVersionId
              ? `Publicada em ${
                  page.publishedAt
                    ? formatDateTime(page.publishedAt)
                    : 'data desconhecida'
                }.`
              : 'A página ainda não foi publicada.'}
          </p>
          <p className="mt-1 text-sm text-muted">
            Rascunho atualizado em {formatDateTime(page.draftUpdatedAt)}.
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Versões</h2>
          {page.versions.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nenhuma versão publicada.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {page.versions.map((version) => (
                <VersionRow
                  key={version.id}
                  version={version}
                  published={version.id === page.publishedVersionId}
                />
              ))}
            </ul>
          )}
          <div className="mt-4 space-y-2">
            <Select
              value={versionId}
              onChange={(event) => setVersionId(event.target.value)}
            >
              <option value="">Selecione uma versão</option>
              {page.versions.map((version) => (
                <option key={version.id} value={version.id}>
                  Versão {version.version}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void revert()}
              disabled={loading || !versionId}
            >
              Restaurar versão
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Endereço</h2>
          <p className="mt-2 text-sm text-muted">
            Página pública em <strong>/{page.slug}</strong>.
          </p>
          {page.isSystem ? (
            <p className="mt-2 text-xs text-muted">
              Página padrão do sistema.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function VersionRow({
  version,
  published,
}: {
  version: CmsVersionView;
  published: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
      <span>
        Versão {version.version}
        {published ? (
          <span className="ml-2 text-xs font-medium text-[var(--vs-color-success,#0f766e)]">
            publicada
          </span>
        ) : null}
      </span>
      <span className="text-xs text-muted">
        {formatDateTime(version.createdAt)}
      </span>
    </li>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: CmsBlock;
  onChange: (block: CmsBlock) => void;
}) {
  switch (block.type) {
    case 'hero':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título" htmlFor={`hero-title-${block.title}`}>
            <Input
              value={block.title}
              onChange={(event) =>
                onChange({ ...block, title: event.target.value })
              }
              maxLength={240}
            />
          </Field>
          <Field label="Imagem (URL)" htmlFor={`hero-image-${block.title}`}>
            <Input
              value={block.imageUrl ?? ''}
              onChange={(event) =>
                onChange({ ...block, imageUrl: event.target.value })
              }
            />
          </Field>
          <Field label="Subtítulo" htmlFor={`hero-subtitle-${block.title}`}>
            <Input
              value={block.subtitle ?? ''}
              onChange={(event) =>
                onChange({ ...block, subtitle: event.target.value })
              }
            />
          </Field>
          <Field label="Rótulo do botão" htmlFor={`hero-label-${block.title}`}>
            <Input
              value={block.ctaLabel ?? ''}
              onChange={(event) =>
                onChange({ ...block, ctaLabel: event.target.value })
              }
            />
          </Field>
          <Field label="Link do botão" htmlFor={`hero-href-${block.title}`}>
            <Input
              value={block.ctaHref ?? ''}
              onChange={(event) =>
                onChange({ ...block, ctaHref: event.target.value })
              }
              placeholder="/contato ou https://..."
            />
          </Field>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-3">
          <Field label="Título (opcional)" htmlFor={`text-title-${block.body}`}>
            <Input
              value={block.title ?? ''}
              onChange={(event) =>
                onChange({ ...block, title: event.target.value })
              }
            />
          </Field>
          <Field label="Texto" htmlFor={`text-body-${block.body}`}>
            <Textarea
              value={block.body}
              onChange={(event) =>
                onChange({ ...block, body: event.target.value })
              }
              rows={6}
            />
          </Field>
        </div>
      );

    case 'image':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="URL da imagem" htmlFor={`image-url-${block.url}`}>
            <Input
              value={block.url}
              onChange={(event) =>
                onChange({ ...block, url: event.target.value })
              }
            />
          </Field>
          <Field label="Texto alternativo" htmlFor={`image-alt-${block.url}`}>
            <Input
              value={block.alt}
              onChange={(event) =>
                onChange({ ...block, alt: event.target.value })
              }
            />
          </Field>
          <Field label="Legenda (opcional)" htmlFor={`image-caption-${block.url}`}>
            <Input
              value={block.caption ?? ''}
              onChange={(event) =>
                onChange({ ...block, caption: event.target.value })
              }
            />
          </Field>
        </div>
      );

    case 'cta':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título" htmlFor={`cta-title-${block.title}`}>
            <Input
              value={block.title}
              onChange={(event) =>
                onChange({ ...block, title: event.target.value })
              }
            />
          </Field>
          <Field label="Texto (opcional)" htmlFor={`cta-text-${block.title}`}>
            <Input
              value={block.text ?? ''}
              onChange={(event) =>
                onChange({ ...block, text: event.target.value })
              }
            />
          </Field>
          <Field label="Rótulo do botão" htmlFor={`cta-label-${block.label}`}>
            <Input
              value={block.label}
              onChange={(event) =>
                onChange({ ...block, label: event.target.value })
              }
            />
          </Field>
          <Field label="Link do botão" htmlFor={`cta-href-${block.href}`}>
            <Input
              value={block.href}
              onChange={(event) =>
                onChange({ ...block, href: event.target.value })
              }
            />
          </Field>
        </div>
      );

    case 'services':
      return (
        <div className="space-y-3">
          <Field label="Título (opcional)" htmlFor={`services-title-${block.items.length}`}>
            <Input
              value={block.title ?? ''}
              onChange={(event) =>
                onChange({ ...block, title: event.target.value })
              }
            />
          </Field>
          <div className="space-y-3">
            {block.items.map((item, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={item.title}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      items: block.items.map((current, position) =>
                        position === index
                          ? { ...current, title: event.target.value }
                          : current,
                      ),
                    })
                  }
                  placeholder="Título do serviço"
                />
                <div className="flex gap-2">
                  <Input
                    value={item.description}
                    onChange={(event) =>
                      onChange({
                        ...block,
                        items: block.items.map((current, position) =>
                          position === index
                            ? { ...current, description: event.target.value }
                            : current,
                        ),
                      })
                    }
                    placeholder="Descrição"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    className="!min-h-0 !px-3"
                    onClick={() =>
                      onChange({
                        ...block,
                        items: block.items.filter(
                          (_, position) => position !== index,
                        ),
                      })
                    }
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onChange({
                ...block,
                items: [
                  ...block.items,
                  { title: 'Novo serviço', description: 'Descrição do serviço' },
                ],
              })
            }
          >
            Adicionar serviço
          </Button>
        </div>
      );

    case 'testimonials':
      return (
        <div className="space-y-3">
          <Field label="Título (opcional)" htmlFor={`testimonials-title-${block.items.length}`}>
            <Input
              value={block.title ?? ''}
              onChange={(event) =>
                onChange({ ...block, title: event.target.value })
              }
            />
          </Field>
          <div className="space-y-3">
            {block.items.map((item, index) => (
              <div key={index} className="rounded border border-line p-3">
                <div className="flex gap-2">
                  <Input
                    value={item.name}
                    onChange={(event) =>
                      onChange({
                        ...block,
                        items: block.items.map((current, position) =>
                          position === index
                            ? { ...current, name: event.target.value }
                            : current,
                        ),
                      })
                    }
                    placeholder="Nome"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    className="!min-h-0 !px-3"
                    onClick={() =>
                      onChange({
                        ...block,
                        items: block.items.filter(
                          (_, position) => position !== index,
                        ),
                      })
                    }
                  >
                    ×
                  </Button>
                </div>
                <Textarea
                  className="mt-2"
                  value={item.text}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      items: block.items.map((current, position) =>
                        position === index
                          ? { ...current, text: event.target.value }
                          : current,
                      ),
                    })
                  }
                  placeholder="Depoimento"
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onChange({
                ...block,
                items: [
                  ...block.items,
                  { name: 'Cliente', text: 'Depoimento do cliente.' },
                ],
              })
            }
          >
            Adicionar depoimento
          </Button>
        </div>
      );

    case 'faq':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título" htmlFor={`faq-title-${block.title ?? ''}`}>
            <Input
              value={block.title ?? ''}
              onChange={(event) =>
                onChange({ ...block, title: event.target.value })
              }
            />
          </Field>
          <Field label="Texto (opcional)" htmlFor={`faq-text-${block.title ?? ''}`}>
            <Input
              value={block.text ?? ''}
              onChange={(event) =>
                onChange({ ...block, text: event.target.value })
              }
            />
          </Field>
        </div>
      );

    case 'contact':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título" htmlFor={`contact-title-${block.title ?? ''}`}>
            <Input
              value={block.title ?? ''}
              onChange={(event) =>
                onChange({ ...block, title: event.target.value })
              }
            />
          </Field>
          <Field label="Texto (opcional)" htmlFor={`contact-text-${block.title ?? ''}`}>
            <Input
              value={block.text ?? ''}
              onChange={(event) =>
                onChange({ ...block, text: event.target.value })
              }
            />
          </Field>
        </div>
      );
  }
}

function createBlock(type: CmsBlockType): CmsBlock {
  switch (type) {
    case 'hero':
      return {
        type: 'hero',
        title: 'Novo destaque',
        subtitle: 'Descreva o principal benefício para o cliente.',
        ctaLabel: 'Solicitar orçamento',
        ctaHref: '#contato',
      };
    case 'text':
      return {
        type: 'text',
        title: 'Novo texto',
        body: 'Escreva o conteúdo aqui. Separe parágrafos com uma linha em branco.',
      };
    case 'image':
      return {
        type: 'image',
        url: 'https://placehold.co/1200x630',
        alt: 'Descrição da imagem',
      };
    case 'cta':
      return {
        type: 'cta',
        title: 'Pronto para começar?',
        text: 'Fale com a equipe e receba uma estimativa.',
        label: 'Solicitar orçamento',
        href: '/contato',
      };
    case 'services':
      return {
        type: 'services',
        title: 'Serviços',
        items: [
          {
            title: 'Instalação',
            description: 'Instalação com dimensionamento e testes.',
          },
        ],
      };
    case 'testimonials':
      return {
        type: 'testimonials',
        title: 'O que dizem nossos clientes',
        items: [{ name: 'Cliente', text: 'Atendimento rápido e organizado.' }],
      };
    case 'faq':
      return { type: 'faq', title: 'Perguntas frequentes' };
    case 'contact':
      return { type: 'contact', title: 'Solicite seu orçamento' };
  }
}
