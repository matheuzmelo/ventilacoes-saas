import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Card, PageTitle } from '@vs/ui';
import { LEAD_STATUS_LABELS } from '@vs/shared';
import { getLead, getTenantSettings } from '@/lib/api';
import { formatDateTime, whatsappLink } from '@/lib/format';
import { LeadActions } from '@/components/admin/lead-actions';
import { StatusBadge } from '@/components/admin/status-badge';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [lead, tenant] = await Promise.all([getLead(id), getTenantSettings()]);

  if (!lead) {
    notFound();
  }

  const timezone = tenant?.settings?.timezone ?? 'America/Sao_Paulo';

  return (
    <>
      <PageTitle
        title={`Lead ${lead.protocol}`}
        description={`Recebido em ${formatDateTime(lead.createdAt, timezone)}`}
        action={<StatusBadge status={lead.status} />}
      />

      <div className="mb-6">
        <Link href="/admin/leads" className="text-sm text-brand hover:underline">
          ← Voltar para leads
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold">Contato</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted">Nome</dt>
                <dd className="mt-1 font-medium">{lead.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">WhatsApp</dt>
                <dd className="mt-1">
                  <a
                    href={whatsappLink(lead.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand hover:underline"
                  >
                    {lead.whatsapp}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">E-mail</dt>
                <dd className="mt-1">{lead.email ?? 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">Cidade</dt>
                <dd className="mt-1">
                  {lead.city}
                  {lead.neighborhood ? ` · ${lead.neighborhood}` : ''}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Solicitação</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase text-muted">Serviço</dt>
                <dd className="mt-1">{lead.serviceType}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">Equipamentos</dt>
                <dd className="mt-1">{lead.equipmentCount}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">BTU</dt>
                <dd className="mt-1">{lead.btu ?? 'Não informado'}</dd>
              </div>
            </dl>
            {lead.notes ? (
              <div className="mt-4">
                <p className="text-xs uppercase text-muted">Observações</p>
                <p className="mt-1 whitespace-pre-line text-sm">{lead.notes}</p>
              </div>
            ) : null}
            {lead.utm ? (
              <div className="mt-4">
                <p className="text-xs uppercase text-muted">Origem da campanha</p>
                <pre className="mt-1 overflow-x-auto rounded bg-[#f6f8fa] p-3 text-xs">
                  {JSON.stringify(lead.utm, null, 2)}
                </pre>
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Histórico</h2>
            <ul className="mt-4 space-y-4">
              {lead.events.map((event) => (
                <li key={event.id} className="border-l-2 border-brand/40 pl-4">
                  <p className="text-sm font-medium">
                    {eventLabel(event.type)}
                    {event.fromStatus && event.toStatus
                      ? `: ${LEAD_STATUS_LABELS[event.fromStatus]} → ${LEAD_STATUS_LABELS[event.toStatus]}`
                      : ''}
                  </p>
                  {event.note ? (
                    <p className="mt-1 whitespace-pre-line text-sm text-muted">
                      {event.note}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(event.createdAt, timezone)}
                  </p>
                </li>
              ))}
              {lead.events.length === 0 ? (
                <li className="text-sm text-muted">Sem eventos registrados.</li>
              ) : null}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold">Atualizar lead</h2>
            <LeadActions leadId={lead.id} currentStatus={lead.status} />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Consentimento</h2>
            {lead.consent ? (
              <div className="mt-3 space-y-2 text-sm text-muted">
                <p>
                  Política <strong>{lead.consent.policySlug}</strong> versão{' '}
                  {lead.consent.policyVersion}
                </p>
                <p className="whitespace-pre-line">{lead.consent.text}</p>
                <p className="text-xs">
                  Registrado em{' '}
                  {formatDateTime(lead.consent.createdAt, timezone)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Nenhum consentimento registrado.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Informações</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Origem</dt>
                <dd>{lead.source}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Status</dt>
                <dd>
                  <Badge>{LEAD_STATUS_LABELS[lead.status]}</Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Primeira resposta</dt>
                <dd>
                  {lead.firstResponseAt
                    ? formatDateTime(lead.firstResponseAt, timezone)
                    : 'Pendente'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

function eventLabel(type: string): string {
  switch (type) {
    case 'CREATED':
      return 'Lead criado';
    case 'STATUS_CHANGED':
      return 'Status alterado';
    case 'NOTE':
      return 'Nota adicionada';
    case 'NOTIFIED':
      return 'Equipe notificada';
    default:
      return type;
  }
}
