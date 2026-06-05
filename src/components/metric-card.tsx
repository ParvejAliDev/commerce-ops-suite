import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';

type MetricCardTone =
  | 'neutral'
  | 'primary'
  | 'warning'
  | 'success'
  | 'destructive';

const toneClasses: Record<MetricCardTone, string> = {
  neutral: 'border-border/70 bg-card/80',
  primary: 'border-primary/20 bg-primary/7',
  warning:
    'border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10',
  success:
    'border-[color:var(--color-success)]/28 bg-[color:var(--color-success)]/10',
  destructive: 'border-destructive/25 bg-destructive/8',
};

export function MetricCard({
  label,
  value,
  helper,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: MetricCardTone;
}) {
  return (
    <Card className={cn('border shadow-sm', toneClasses[tone])}>
      <CardHeader className="gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        <CardTitle className="text-4xl leading-none font-semibold tracking-tight text-foreground">
          {value}
        </CardTitle>
      </CardHeader>
      {helper ? (
        <CardContent className="pt-0 text-sm text-muted-foreground">
          {helper}
        </CardContent>
      ) : null}
    </Card>
  );
}
