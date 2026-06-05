import type { ReactNode } from 'react';

import { cn } from '@/src/lib/utils';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="font-heading text-4xl leading-none font-semibold tracking-tight text-foreground lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
