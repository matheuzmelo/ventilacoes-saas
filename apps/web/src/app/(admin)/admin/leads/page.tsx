import Link from 'next/link';
import { Badge, Card, Input, PageTitle, Select } from '@vs/ui';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from '@vs/shared';
import { getLeads, getTenantSettings } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { StatusBadge } from '@/components/admin/status-badge';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function LeadsPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams;
  const params = new URLSearchParams();
  if (status && LEAD_STATUSES.includes(status as LeadStatus)) {
    params.set('status', status);
  }
  if (q?.trim()) {
    params.set('q', q.trim());
  }

  const [payload, tenant] = await Promise.all([
    getLeads(params.toString()),
    getTenantSettings(),
  ]);
  const timezone = tenant?.settings?.timezone ?? 'America/Sao_Paulo';

  return (
    <>
      <PageTitle
        title="Leads"
        description="Solicitações recebidas pelo site e contatos manuais."
        action={
          <Badge tone="success">
            {payload.items.length}
            {payload.nextCursor ? '+' : ''} exibidos
          </Badge>
        }
      />

      <Card className="mb-6">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-muted">Buscar</span>
            <Input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Nome, WhatsApp, cidade ou protocolo"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Status</span>
            <Select name="status" defaultValue={status ?? ''}>
              <option value="">Todos</option>
              {LEAD_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {LEAD_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          <button type="submit" className="vs-btn vs-btn--primary">
            Filtrar
          </button>
          <a href={"/api/admin/v1/leads/export?" + params.toString()} className="vs-btn vs-btn--secondary">
            Exportar CSV
          </a>
        </form>
      </Card>

      {payload.items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            Nenhum lead encontrado com os filtros atuais.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Protocolo</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recebido</th>
              </tr>
            </thead>
            <tbody>
              {payload.items.map((lead) => (
                <tr key={lead.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {lead.protocol}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-muted">
                      {lead.whatsapp} · {lead.city}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{lead.serviceType}</p>
                    <p className="text-xs text-muted">
                      {lead.equipmentCount} equip.
                      {lead.btu ? ` · ${lead.btu} BTU` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDateTime(lead.createdAt, timezone)}
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
