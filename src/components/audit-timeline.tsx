import { cn } from '@/src/lib/utils';

export type AuditTimelineItem = {
  id: string;
  title: string;
  body?: string;
  meta: string;
};

export function AuditTimeline({
  items,
  emptyMessage,
}: {
  items: AuditTimelineItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={item.id} className="relative pl-6">
          <span className="absolute top-1 left-0 size-2.5 rounded-full bg-primary" />
          {index < items.length - 1 ? (
            <span className="absolute top-4 left-[0.28rem] h-[calc(100%-0.25rem)] w-px bg-border" />
          ) : null}
          <div className="space-y-1 rounded-2xl border border-border/65 bg-muted/35 px-4 py-3">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.body ? (
              <p className="text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            ) : null}
            <p
              className={cn(
                'text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground',
              )}
            >
              {item.meta}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
