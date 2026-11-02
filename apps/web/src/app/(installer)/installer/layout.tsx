import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
import { getCurrentUser } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function InstallerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }
  if (user.role === 'ADMIN') {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/installer" className="text-lg font-semibold">
              {user.tenantSlug}
            </Link>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/installer" className="hover:text-ink">
                Minhas OS
              </Link>
              <Link href="/" className="hover:text-ink">
                Ver site
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
