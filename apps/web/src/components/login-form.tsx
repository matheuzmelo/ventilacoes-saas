'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Field, Input } from '@vs/ui';
import type { AuthUser, ErrorEnvelope } from '@vs/shared';
import type { PublicTenant } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export function LoginForm({ tenant }: { tenant: PublicTenant | null }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState(tenant?.slug ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(tenantSlug.trim() ? { tenantSlug: tenantSlug.trim() } : {}),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { user?: AuthUser; error?: ErrorEnvelope['error'] }
        | null;

      if (!response.ok || !body?.user) {
        setError(
          body?.error?.message ??
            'Não foi possível entrar. Verifique os dados e tente novamente.',
        );
        return;
      }

      router.push(body.user.role === 'INSTALLER' ? '/installer' : '/admin');
      router.refresh();
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      {tenant ? (
        <p className="text-sm text-muted">
          Acesso à empresa <strong className="text-ink">{tenant.name}</strong>
        </p>
      ) : (
        <Field label="Empresa (slug)" htmlFor="tenantSlug">
          <Input
            id="tenantSlug"
            name="tenantSlug"
            value={tenantSlug}
            onChange={(event) => setTenantSlug(event.target.value)}
            placeholder="demo"
            autoComplete="organization"
          />
        </Field>
      )}

      <Field label="E-mail" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </Field>

      <Field label="Senha" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          minLength={8}
          required
        />
      </Field>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
