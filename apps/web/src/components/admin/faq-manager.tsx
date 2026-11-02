'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Field, Input, Textarea } from '@vs/ui';
import type { SiteFaqItem } from '@vs/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export function FaqManager({ initialItems }: { initialItems: SiteFaqItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await request('/v1/cms/faq', {
        method: 'POST',
        body: JSON.stringify({ question: question.trim(), answer: answer.trim() }),
      });
      if (!response.ok) {
        setError(response.message);
        return;
      }

      const created = response.body as SiteFaqItem;
      setItems((current) => [...current, created]);
      setQuestion('');
      setAnswer('');
      setMessage('Pergunta adicionada.');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveItem(item: SiteFaqItem) {
    setError(null);
    setMessage(null);
    setBusyId(item.id);

    try {
      const response = await request(`/v1/cms/faq/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }),
      });
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setMessage('Pergunta atualizada.');
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item: SiteFaqItem) {
    if (!window.confirm('Remover esta pergunta?')) {
      return;
    }

    setError(null);
    setMessage(null);
    setBusyId(item.id);

    try {
      const response = await request(`/v1/cms/faq/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage('Pergunta removida.');
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function updateItem(id: string, patch: Partial<SiteFaqItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <Card key={item.id}>
            <Field label="Pergunta" htmlFor={`faq-question-${item.id}`}>
              <Input
                id={`faq-question-${item.id}`}
                value={item.question}
                onChange={(event) =>
                  updateItem(item.id, { question: event.target.value })
                }
                maxLength={240}
              />
            </Field>
            <div className="mt-3">
              <Field label="Resposta" htmlFor={`faq-answer-${item.id}`}>
                <Textarea
                  id={`faq-answer-${item.id}`}
                  value={item.answer}
                  onChange={(event) =>
                    updateItem(item.id, { answer: event.target.value })
                  }
                  maxLength={4000}
                />
              </Field>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                onClick={() => void saveItem(item)}
                disabled={busyId === item.id}
              >
                {busyId === item.id ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => void removeItem(item)}
                disabled={busyId === item.id}
              >
                Remover
              </Button>
            </div>
          </Card>
        ))}
        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Nenhuma pergunta cadastrada. Adicione a primeira ao lado.
            </p>
          </Card>
        ) : null}

        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Nova pergunta</h2>
        <form className="mt-4 space-y-3" onSubmit={createItem}>
          <Field label="Pergunta" htmlFor="new-faq-question">
            <Input
              id="new-faq-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={240}
              required
            />
          </Field>
          <Field label="Resposta" htmlFor="new-faq-answer">
            <Textarea
              id="new-faq-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              maxLength={4000}
              required
            />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

async function request(
  path: string,
  init: RequestInit,
): Promise<{ ok: boolean; body: unknown; message: string }> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init.headers },
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    return {
      ok: response.ok,
      body,
      message: body?.error?.message ?? 'Não foi possível concluir a operação.',
    };
  } catch {
    return {
      ok: false,
      body: null,
      message: 'Não foi possível conectar ao servidor.',
    };
  }
}
