export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
}

export interface LeadNotificationInput {
  tenantName: string;
  leadName: string;
  service: string;
  city: string;
  panelUrl: string;
}

export interface InviteInput {
  tenantName: string;
  inviterName: string;
  inviteUrl: string;
  expiresInDays: number;
}

export interface WorkOrderAssignedInput {
  tenantName: string;
  customerName: string;
  address: string;
  startsAt: string;
  workOrderUrl: string;
}

export interface ChargeLinkInput {
  tenantName: string;
  customerName: string;
  amount: string;
  description: string;
  chargeUrl: string;
  dueDate: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f5f7fa;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1f2933">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #d9e2ec;border-radius:12px;padding:24px">
            <tr><td>
              <h1 style="margin:0 0 16px;font-size:20px;color:#0b6e99">${escapeHtml(title)}</h1>
              ${bodyHtml}
              <p style="margin:24px 0 0;font-size:12px;color:#52606d">
                Esta mensagem foi enviada automaticamente pela plataforma de gestão.
              </p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function leadNotificationEmail(
  input: LeadNotificationInput,
): EmailMessage {
  const subject = `Novo lead: ${input.leadName} — ${input.service}`;
  const html = layout(
    'Novo lead recebido',
    `<p><strong>${escapeHtml(input.leadName)}</strong> solicitou ${escapeHtml(input.service)} em ${escapeHtml(input.city)}.</p>
     <p><a href="${escapeHtml(input.panelUrl)}" style="display:inline-block;background:#0b6e99;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Abrir no painel</a></p>`,
  );
  const text = `Novo lead: ${input.leadName} — ${input.service} (${input.city}). Abra o painel: ${input.panelUrl}`;
  return { subject, html, text };
}

export function inviteEmail(input: InviteInput): EmailMessage {
  const subject = `Convite para ${input.tenantName}`;
  const html = layout(
    `Convite para ${input.tenantName}`,
    `<p>${escapeHtml(input.inviterName)} convidou você para acessar o painel de ${escapeHtml(input.tenantName)}.</p>
     <p><a href="${escapeHtml(input.inviteUrl)}" style="display:inline-block;background:#0b6e99;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Aceitar convite</a></p>
     <p style="font-size:13px;color:#52606d">O link expira em ${input.expiresInDays} dias.</p>`,
  );
  const text = `${input.inviterName} convidou você para ${input.tenantName}. Aceite em: ${input.inviteUrl} (expira em ${input.expiresInDays} dias).`;
  return { subject, html, text };
}

export function workOrderAssignedEmail(
  input: WorkOrderAssignedInput,
): EmailMessage {
  const subject = `Nova OS atribuída: ${input.customerName}`;
  const html = layout(
    'Nova ordem de serviço',
    `<p>Você foi atribuído a uma OS de <strong>${escapeHtml(input.customerName)}</strong>.</p>
     <p><strong>Endereço:</strong> ${escapeHtml(input.address)}<br/>
        <strong>Início:</strong> ${escapeHtml(input.startsAt)}</p>
     <p><a href="${escapeHtml(input.workOrderUrl)}" style="display:inline-block;background:#0b6e99;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Ver OS</a></p>`,
  );
  const text = `Nova OS para ${input.customerName} em ${input.address}, início ${input.startsAt}. Veja: ${input.workOrderUrl}`;
  return { subject, html, text };
}

export function chargeLinkEmail(input: ChargeLinkInput): EmailMessage {
  const subject = `Cobrança de ${input.amount} — ${input.tenantName}`;
  const html = layout(
    'Link de pagamento',
    `<p>Olá, ${escapeHtml(input.customerName)}.</p>
     <p>Segue o link para pagamento de <strong>${escapeHtml(input.description)}</strong> no valor de <strong>${escapeHtml(input.amount)}</strong>, com vencimento em ${escapeHtml(input.dueDate)}.</p>
     <p><a href="${escapeHtml(input.chargeUrl)}" style="display:inline-block;background:#0b6e99;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Pagar agora</a></p>`,
  );
  const text = `Olá, ${input.customerName}. Pagamento de ${input.description}: ${input.amount}, vencimento ${input.dueDate}. Link: ${input.chargeUrl}`;
  return { subject, html, text };
}
