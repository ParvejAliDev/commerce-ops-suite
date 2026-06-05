import { Badge } from '@/src/components/ui/badge';
import { humanizeToken } from '@/src/lib/presenters';
import { cn } from '@/src/lib/utils';

type StatusBadgeTone = 'neutral' | 'warning' | 'success' | 'destructive';

const destructiveStates = new Set(['cancelled', 'failed']);
const warningStates = new Set([
  'pending_review',
  'processing',
  'queued',
  'running',
]);
const successStates = new Set(['shipped', 'completed', 'active']);

export function getStatusBadgeTone(value: string): StatusBadgeTone {
  if (destructiveStates.has(value)) {
    return 'destructive';
  }

  if (warningStates.has(value)) {
    return 'warning';
  }

  if (successStates.has(value)) {
    return 'success';
  }

  return 'neutral';
}

function getStatusBadgeClasses(tone: StatusBadgeTone) {
  if (tone === 'warning') {
    return 'bg-[color:var(--color-warning)]/14 text-[color:var(--color-warning)]';
  }

  if (tone === 'success') {
    return 'bg-[color:var(--color-success)]/14 text-[color:var(--color-success)]';
  }

  if (tone === 'neutral') {
    return 'bg-muted text-muted-foreground';
  }

  return undefined;
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = getStatusBadgeTone(status);

  return (
    <Badge
      variant={tone === 'destructive' ? 'destructive' : 'secondary'}
      className={cn(getStatusBadgeClasses(tone), className)}
    >
      {humanizeToken(status)}
    </Badge>
  );
}
