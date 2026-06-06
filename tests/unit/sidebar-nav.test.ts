import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/orders',
}));

import { SidebarNav } from '../../src/components/sidebar-nav';
import type { CurrentUser } from '../../src/modules/auth/current-user';

const user: CurrentUser = {
  id: 1,
  email: 'ops@example.com',
  fullName: 'Ops User',
  roleName: 'operations',
  permissions: ['orders:read', 'orders:update', 'reports:read'],
};

describe('SidebarNav', () => {
  it('keeps the local runtime section without the Docker Compose description copy', () => {
    const markup = renderToStaticMarkup(createElement(SidebarNav, { user }));

    expect(markup).toContain('Local runtime');
    expect(markup).not.toContain('Docker Compose is the source of truth');
  });
});
