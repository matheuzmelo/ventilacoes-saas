import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BottomNav } from '@/components/bottom-nav';
import { getCurrentUser } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'ADMIN') {
    redirect('/installer');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold">
              {user.tenantSlug}
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
              <Link href="/admin" className="hover:text-ink">
                Painel
              </Link>
              <Link href="/admin/leads" className="hover:text-ink">
                Leads
              </Link>
              <Link href="/admin/conteudo" className="hover:text-ink">
                Conteúdo
              </Link>
              <Link href="/admin/configuracoes" className="hover:text-ink">
                Configurações
              </Link>
              <Link href="/admin/mensagens" className="hover:text-ink">
                Mensagens
              </Link>
              <Link href="/" className="hover:text-ink">
                Ver site
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 pb-20 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
