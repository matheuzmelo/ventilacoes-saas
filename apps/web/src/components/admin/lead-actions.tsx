'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Field, Select, Textarea } from '@vs/ui';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TRANSITIONS,
  type LeadStatus,
} from '@vs/shared';
import type { ErrorEnvelope } from '@vs/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export function LeadActions({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: LeadStatus;
}) {
  const router = useRouter();
  const options = LEAD_STATUS_TRANSITIONS[currentStatus];
  const [status, setStatus] = useState<LeadStatus>(options[0] ?? currentStatus);
  const [note, setNote] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteMessage, setNoteMessage] = useState<string | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusError(null);
    setStatusMessage(null);
    setStatusLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: ErrorEnvelope['error'] }
        | null;

      if (!response.ok) {
        setStatusError(body?.error?.message ?? 'Não foi possível atualizar.');
        return;
      }

      setNote('');
      setStatusMessage('Status atualizado.');
      router.refresh();
    } catch {
      setStatusError('Não foi possível conectar ao servidor.');
    } finally {
      setStatusLoading(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNoteError(null);
    setNoteMessage(null);
    setNoteLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: ErrorEnvelope['error'] }
        | null;

      if (!response.ok) {
        setNoteError(body?.error?.message ?? 'Não foi possível salvar a nota.');
        return;
      }

      setNewNote('');
      setNoteMessage('Nota adicionada.');
      router.refresh();
    } catch {
      setNoteError('Não foi possível conectar ao servidor.');
    } finally {
      setNoteLoading(false);
    }
  }

  if (options.length === 0) {
    return (
      <p className="mt-2 text-sm text-muted">
        Este lead está em um status final e não pode ser alterado.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <form className="space-y-3" onSubmit={updateStatus}>
        <Field label="Próximo status" htmlFor="lead-status">
          <Select
            id="lead-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as LeadStatus)}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {LEAD_STATUS_LABELS[option]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nota (opcional)" htmlFor="lead-status-note">
          <Textarea
            id="lead-status-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={2000}
            placeholder="Registre o contato ou o motivo da mudança."
          />
        </Field>
        {statusError ? <Alert tone="danger">{statusError}</Alert> : null}
        {statusMessage ? <Alert tone="success">{statusMessage}</Alert> : null}
        <Button type="submit" disabled={statusLoading}>
          {statusLoading ? 'Salvando...' : 'Atualizar status'}
        </Button>
      </form>

      <form className="space-y-3 border-t border-line pt-5" onSubmit={addNote}>
        <Field label="Nova nota" htmlFor="lead-note">
          <Textarea
            id="lead-note"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            required
            maxLength={4000}
          />
        </Field>
        {noteError ? <Alert tone="danger">{noteError}</Alert> : null}
        {noteMessage ? <Alert tone="success">{noteMessage}</Alert> : null}
        <Button type="submit" variant="secondary" disabled={noteLoading}>
          {noteLoading ? 'Adicionando...' : 'Adicionar nota'}
        </Button>
      </form>
    </div>
  );
}
