import type { ReactNode } from 'react';

import { AppShell } from '@/src/components/app-shell';
import { requireCurrentUser } from '@/src/modules/auth/current-user';

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireCurrentUser();

  return <AppShell user={user}>{children}</AppShell>;
}
