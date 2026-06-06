import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/src/components/sidebar-nav', () => ({
  SidebarNav: () => null,
}));

vi.mock('@/src/components/top-status-bar', () => ({
  TopStatusBar: () => null,
}));

import { AppShell } from '../../src/components/app-shell';
import type { CurrentUser } from '../../src/modules/auth/current-user';

const user: CurrentUser = {
  id: 1,
  email: 'ops@example.com',
  fullName: 'Ops User',
  roleName: 'admin',
  permissions: ['orders:read', 'reports:read', 'users:read'],
};

type LayoutElement = ReactElement<{
  children?: unknown;
  className?: string;
}>;

describe('AppShell', () => {
  it('locks the workspace shell to the viewport and scrolls only the main pane', () => {
    const shell = AppShell({ user, children: 'Orders workspace' }) as LayoutElement;
    const grid = shell.props.children as LayoutElement;
    const [aside, contentColumn] = grid.props.children as LayoutElement[];
    const [, , main] = contentColumn.props.children as LayoutElement[];

    expect(shell.props.className).toContain('h-screen');
    expect(shell.props.className).toContain('overflow-hidden');
    expect(shell.props.className).not.toContain('min-h-screen');

    expect(grid.props.className).toContain('h-full');
    expect(grid.props.className).not.toContain('min-h-screen');

    expect(aside.props.className).toContain('overflow-y-auto');
    expect(contentColumn.props.className).toContain('min-h-0');
    expect(main.props.className).toContain('min-h-0');
    expect(main.props.className).toContain('overflow-y-auto');
  });
});
