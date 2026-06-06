import Link from 'next/link';

import { logoutAction } from '@/app/(workspace)/actions';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Separator } from '@/src/components/ui/separator';
import type { CurrentUser } from '@/src/modules/auth/current-user';

export function TopStatusBar({ user }: { user: CurrentUser }) {
  return (
    <header className="border-b border-border/70 bg-card/85 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge className="bg-[color:var(--color-success)]/14 text-[color:var(--color-success)]">
            Local mode
          </Badge>
          <span className="font-medium text-foreground">{user.fullName}</span>
          <span>{user.email}</span>
          <Separator orientation="vertical" className="hidden h-5 xl:block" />
          <Badge variant="outline">{user.roleName}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/api/health">Health</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/api/ready">Ready</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/api/metrics">Metrics</Link>
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
