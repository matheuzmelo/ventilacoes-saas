import { Badge, Card, PageTitle } from '@vs/ui';
import { getOutboxLogs, getTenantSettings } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { OutboxRetry } from '@/components/admin/outbox-retry';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const [logs, tenant] = await Promise.all([
    getOutboxLogs(),
    getTenantSettings(),
  ]);
  const timezone = tenant?.settings?.timezone ?? 'America/Sao_Paulo';

  return (
    <>
      <PageTitle
        title="Mensagens"
        description="Fila de e-mails transacionais e histórico de envios."
      />

      {logs.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Nenhum envio registrado.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Destinatário</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tentativas</th>
                <th className="px-4 py-3">Criado</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p>{log.recipient}</p>
                    {log.subject ? (
                      <p className="text-xs text-muted">{log.subject}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{log.template}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.status} />
                    {log.lastError ? (
                      <p className="mt-1 max-w-xs text-xs text-muted">
                        {log.lastError}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{log.attempts}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatDateTime(log.createdAt, timezone)}
                  </td>
                  <td className="px-4 py-3">
                    {log.status !== 'SENT' ? (
                      <OutboxRetry id={log.id} />
                    ) : (
                      <span className="text-xs text-muted">Enviado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SENT') {
    return <Badge tone="success">Enviado</Badge>;
  }
  if (status === 'FAILED') {
    return <Badge tone="danger">Falhou</Badge>;
  }
  return <Badge tone="warning">Pendente</Badge>;
}
