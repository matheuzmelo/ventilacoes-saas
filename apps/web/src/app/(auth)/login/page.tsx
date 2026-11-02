import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card } from '@vs/ui';
import { LoginForm } from '@/components/login-form';
import { getCurrentUser, getTenant } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Entrar',
};

export default async function LoginPage() {
  const [user, tenant] = await Promise.all([getCurrentUser(), getTenant()]);

  if (user) {
    redirect(user.role === 'INSTALLER' ? '/installer' : '/admin');
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-medium text-brand hover:underline">
            {tenant?.name ?? 'Climatização'}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">Acessar o painel</h1>
          <p className="mt-1 text-sm text-muted">
            Use o e-mail e a senha cadastrados pela sua empresa.
          </p>
        </div>

        <Card>
          <LoginForm tenant={tenant} />
        </Card>

        <p className="mt-6 text-center text-xs text-muted">
          Problemas para entrar? Fale com o administrador da sua empresa.
        </p>
      </div>
    </main>
  );
}
