import type { ReactNode } from 'react';

import { cn } from '@/src/lib/utils';

export function FilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border/70 bg-card/88 p-4 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
