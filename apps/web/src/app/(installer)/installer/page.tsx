import { redirect } from 'next/navigation';
import { Alert, Badge, Card, PageTitle } from '@vs/ui';
import { getCurrentUser } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function InstallerPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <PageTitle
        title="Minhas ordens de serviço"
        description="Acompanhe os atendimentos atribuídos a você."
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Agenda</h2>
          <Badge tone="warning">Nenhuma OS atribuída</Badge>
        </div>
        <p className="mt-3 text-sm text-muted">
          Quando o administrador atribuir uma ordem de serviço, ela aparece aqui
          com endereço, janela de atendimento e checklist.
        </p>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Seu acesso</h2>
          <p className="mt-2 text-sm text-muted">
            Papel: <strong className="text-ink">{user.role}</strong>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.permissions.map((permission) => (
              <Badge key={permission}>{permission}</Badge>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Execução no campo</h2>
          <p className="mt-2 text-sm text-muted">
            Fotos, checklist e assinatura do cliente serão adicionados junto com
            a agenda.
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Alert tone="info">
          A agenda e a execução de OS entram na etapa A4. Nesta fase, o acesso e
          as permissões do instalador já estão isolados por empresa.
        </Alert>
      </div>
    </>
  );
}
