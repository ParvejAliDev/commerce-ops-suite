import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="border border-dashed border-border/90 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
