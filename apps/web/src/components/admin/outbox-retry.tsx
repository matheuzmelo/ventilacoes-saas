'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vs/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export function OutboxRetry({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function retry() {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch(`${API_URL}/v1/messages/${id}/retry`, {
        method: 'POST',
      });
      if (!response.ok) {
        setError(true);
        return;
      }
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="!min-h-0 !px-3 !py-1 text-xs"
        onClick={() => void retry()}
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Reenviar'}
      </Button>
      {error ? (
        <span className="ml-2 text-xs text-[var(--vs-color-danger,#b42318)]">
          Falhou
        </span>
      ) : null}
    </div>
  );
}
