import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge, Card, PageTitle } from '@vs/ui';
import { getCurrentUser, getTenantSettings } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [user, payload] = await Promise.all([
    getCurrentUser(),
    getTenantSettings(),
  ]);

  if (!user || !payload) {
    redirect('/login');
  }

  const settings = payload.settings;
  const discount = Number(settings?.maxDiscountPercent ?? 0);

  return (
    <>
      <PageTitle
        title={`Olá, ${user.name.split(' ')[0]}`}
        description="Visão geral da empresa e dos acessos."
        action={<Badge tone="success">Fase A</Badge>}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Empresa</p>
          <p className="mt-2 text-xl font-semibold">{payload.tenant.name}</p>
          <p className="mt-1 text-sm text-muted">{payload.tenant.slug}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Fuso horário</p>
          <p className="mt-2 text-xl font-semibold">
            {settings?.timezone ?? 'America/Sao_Paulo'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {settings?.locale ?? 'pt-BR'} · {settings?.currency ?? 'BRL'}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Validade padrão do orçamento</p>
          <p className="mt-2 text-xl font-semibold">
            {settings?.defaultValidityDays ?? 7} dias
          </p>
          <p className="mt-1 text-sm text-muted">
            Desconto máximo: {Number.isFinite(discount) ? discount : 0}%
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Link href="/admin/leads" className="block">
          <Card className="h-full transition hover:border-brand">
            <h2 className="text-lg font-semibold">Leads</h2>
            <p className="mt-2 text-sm text-muted">
              Veja solicitações recebidas, registre contatos e acompanhe o
              funil.
            </p>
          </Card>
        </Link>
        <Link href="/admin/conteudo" className="block">
          <Card className="h-full transition hover:border-brand">
            <h2 className="text-lg font-semibold">Conteúdo do site</h2>
            <p className="mt-2 text-sm text-muted">
              Edite páginas, publique versões, mantenha FAQ e políticas.
            </p>
          </Card>
        </Link>
        <Link href="/admin/configuracoes" className="block">
          <Card className="h-full transition hover:border-brand">
            <h2 className="text-lg font-semibold">Identidade e contato</h2>
            <p className="mt-2 text-sm text-muted">
              Ajuste nome, cores, WhatsApp e informações exibidas no site.
            </p>
          </Card>
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Estimativa no site</h2>
          <p className="mt-2 text-sm text-muted">
            Modo atual:{' '}
            <strong className="text-ink">
              {settings?.estimateMode === 'COLLECT_ONLY'
                ? 'Somente coleta de dados'
                : 'Faixa de preço'}
            </strong>
          </p>
          <p className="mt-2 text-sm text-muted">
            O formulário público já registra leads com consentimento e notifica
            a equipe por e-mail.
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Seu acesso</h2>
          <p className="mt-2 text-sm text-muted">
            Papel: <strong className="text-ink">{payload.membership.role}</strong>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {payload.membership.permissions.map((permission) => (
              <Badge key={permission}>{permission}</Badge>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
