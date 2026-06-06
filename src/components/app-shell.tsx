import type { ReactNode } from 'react';

import { SidebarNav } from '@/src/components/sidebar-nav';
import { TopStatusBar } from '@/src/components/top-status-bar';
import type { CurrentUser } from '@/src/modules/auth/current-user';

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="grid h-full lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden h-full overflow-y-auto border-r border-sidebar-border bg-sidebar lg:block">
          <SidebarNav user={user} />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <TopStatusBar user={user} />
          <div className="border-b border-border/70 bg-card/65 px-4 py-3 lg:hidden">
            <SidebarNav user={user} mobile />
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
