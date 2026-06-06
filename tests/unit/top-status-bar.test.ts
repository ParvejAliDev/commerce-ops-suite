import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { TopStatusBar } from '../../src/components/top-status-bar';

describe('TopStatusBar', () => {
  it('renders a visible log out action', () => {
    const markup = renderToStaticMarkup(
      TopStatusBar({
        user: {
          id: 1,
          email: 'ops@example.com',
          fullName: 'Ops User',
          roleName: 'admin',
          permissions: ['orders:read', 'reports:read', 'users:read'],
        },
      }),
    );

    expect(markup).toContain('Log out');
  });
});
