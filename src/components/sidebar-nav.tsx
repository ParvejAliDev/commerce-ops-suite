'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Boxes,
  ClipboardList,
  FileSpreadsheet,
  Users,
} from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import type { CurrentUser } from '@/src/modules/auth/current-user';
import type { Permission } from '@/src/modules/rbac';

type SidebarNavProps = {
  user: CurrentUser;
  mobile?: boolean;
};

type NavItem = {
  href: '/orders' | '/reports' | '/users';
  label: string;
  icon: typeof ClipboardList;
  permission?: Permission;
};

const navItems: NavItem[] = [
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/reports', label: 'Reports', icon: FileSpreadsheet },
  { href: '/users', label: 'Users', icon: Users, permission: 'users:read' },
];

export function SidebarNav({ user, mobile = false }: SidebarNavProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter(
    (item) => !item.permission || user.permissions.includes(item.permission),
  );

  return (
    <div
      className={cn(
        mobile ? 'flex flex-col gap-4' : 'flex h-full flex-col gap-8 px-6 py-8',
      )}
    >
      <div className={cn('flex items-center gap-3', mobile && 'px-1')}>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/15">
          <Boxes className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/55">
            Commerce Ops
          </p>
          <p className="text-sm font-medium text-sidebar-foreground">
            Local cockpit
          </p>
        </div>
      </div>

      <div className={cn('flex gap-2', mobile ? 'flex-wrap' : 'flex-col')}>
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'justify-start gap-2 rounded-2xl border border-transparent text-sm',
                !mobile && 'h-11 px-4',
                mobile && 'h-9 px-3',
                isActive &&
                  'border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground shadow-sm',
                !isActive &&
                  'text-sidebar-foreground/78 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )}
            >
              <Link href={item.href}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>

      {!mobile ? (
        <div className="mt-auto rounded-3xl border border-sidebar-border bg-sidebar-accent/65 p-4 text-sm text-sidebar-accent-foreground">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/55">
            <Activity className="size-3.5" />
            Local runtime
          </div>
        </div>
      ) : null}
    </div>
  );
}
