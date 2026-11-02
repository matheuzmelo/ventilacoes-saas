'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vs/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch(`${API_URL}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? 'Saindo...' : 'Sair'}
    </Button>
  );
}
