export function formatDateTime(
  value: string | Date,
  timezone = 'America/Sao_Paulo',
): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(value));
}

export function whatsappLink(value: string): string {
  return `https://wa.me/${value.replace(/\D/g, '')}`;
}
