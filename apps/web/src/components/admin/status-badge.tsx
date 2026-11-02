import { Badge } from '@vs/ui';
import { LEAD_STATUS_LABELS, type LeadStatus } from '@vs/shared';

export function StatusBadge({ status }: { status: LeadStatus }) {
  const tone =
    status === 'WON'
      ? 'success'
      : status === 'LOST'
        ? 'danger'
        : status === 'NEW'
          ? 'neutral'
          : 'warning';
  return <Badge tone={tone}>{LEAD_STATUS_LABELS[status]}</Badge>;
}
