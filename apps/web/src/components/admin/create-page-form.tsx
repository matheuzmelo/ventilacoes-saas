'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Field, Input } from '@vs/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export function CreatePageForm() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/cms/pages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim(),
          title: title.trim(),
          blocks: [
            {
              type: 'text',
              title: title.trim(),
              body: 'Escreva o conteúdo desta página.',
            },
          ],
          showInNav: false,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { slug?: string; error?: { message?: string } }
        | null;

      if (!response.ok || !body?.slug) {
        setError(body?.error?.message ?? 'Não foi possível criar a página.');
        return;
      }

      router.push(`/admin/conteudo/${body.slug}`);
      router.refresh();
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <Field label="Título" htmlFor="new-page-title">
        <Input
          id="new-page-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={2}
          maxLength={120}
          required
        />
      </Field>
      <Field label="Slug" htmlFor="new-page-slug">
        <Input
          id="new-page-slug"
          value={slug}
          onChange={(event) =>
            setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'))
          }
          pattern="[a-z0-9-]+"
          minLength={2}
          maxLength={80}
          placeholder="ex.: servicos"
          required
        />
      </Field>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar página'}
      </Button>
    </form>
  );
}
