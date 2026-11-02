'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Field, Input, Textarea } from '@vs/ui';
import type { LegalDocumentView } from '@vs/shared';
import { formatDate } from '@/lib/format';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const SLUGS = [
  { value: 'privacidade', label: 'Política de Privacidade' },
  { value: 'termos', label: 'Termos de Uso' },
];

export function LegalManager({
  initialDocuments,
}: {
  initialDocuments: LegalDocumentView[];
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [slug, setSlug] = useState('privacidade');
  const versions = documents.filter((document) => document.slug === slug);
  const latest = versions[0];
  const [title, setTitle] = useState(latest?.title ?? '');
  const [body, setBody] = useState(latest?.body ?? '');
  const [effectiveAt, setEffectiveAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function changeSlug(nextSlug: string) {
    setSlug(nextSlug);
    const nextLatest = documents.find(
      (document) => document.slug === nextSlug,
    );
    setTitle(nextLatest?.title ?? '');
    setBody(nextLatest?.body ?? '');
    setError(null);
    setMessage(null);
  }

  async function createVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/cms/legal/${slug}/versions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          ...(effectiveAt
            ? { effectiveAt: new Date(`${effectiveAt}T12:00:00`).toISOString() }
            : {}),
        }),
      });
      const created = (await response.json().catch(() => null)) as
        | (LegalDocumentView & { error?: { message?: string } })
        | null;

      if (!response.ok || !created || created.error) {
        setError(created?.error?.message ?? 'Não foi possível criar a versão.');
        return;
      }

      setDocuments((current) =>
        [created, ...current].sort((a, b) =>
          a.slug === b.slug ? b.version - a.version : a.slug.localeCompare(b.slug),
        ),
      );
      setEffectiveAt('');
      setMessage(`Versão ${created.version} criada.`);
      router.refresh();
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <form className="space-y-4" onSubmit={createVersion}>
          <Field label="Documento" htmlFor="legal-slug">
            <select
              id="legal-slug"
              className="vs-input vs-select"
              value={slug}
              onChange={(event) => changeSlug(event.target.value)}
            >
              {SLUGS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Título" htmlFor="legal-title">
            <Input
              id="legal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              required
            />
          </Field>
          <Field label="Conteúdo" htmlFor="legal-body">
            <Textarea
              id="legal-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={14}
              required
            />
          </Field>
          <Field
            label="Vigência a partir de (opcional)"
            htmlFor="legal-effective-at"
          >
            <Input
              id="legal-effective-at"
              type="date"
              value={effectiveAt}
              onChange={(event) => setEffectiveAt(event.target.value)}
            />
          </Field>

          {error ? <Alert tone="danger">{error}</Alert> : null}
          {message ? <Alert tone="success">{message}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Publicando...' : 'Publicar nova versão'}
            </Button>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="vs-btn vs-btn--secondary"
            >
              Ver no site
            </a>
          </div>
          <p className="text-xs text-muted">
            Cada salvamento cria uma nova versão imutável. Leads registram a
            versão aceita no momento do consentimento.
          </p>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Histórico</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {versions.map((document, index) => (
            <li key={`${document.slug}-${document.version}`}>
              <p className="font-medium">
                Versão {document.version}
                {index === 0 ? (
                  <span className="ml-2 text-xs font-medium text-[var(--vs-color-success,#0f766e)]">
                    vigente
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted">
                {formatDate(document.effectiveAt)}
              </p>
            </li>
          ))}
          {versions.length === 0 ? (
            <li className="text-muted">Nenhuma versão cadastrada.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
