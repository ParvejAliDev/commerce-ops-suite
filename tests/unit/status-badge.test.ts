import { describe, expect, it } from 'vitest';

import { getStatusBadgeTone } from '../../src/components/status-badge';

describe('getStatusBadgeTone', () => {
  it('maps failure-like states to destructive styling', () => {
    expect(getStatusBadgeTone('failed')).toBe('destructive');
    expect(getStatusBadgeTone('cancelled')).toBe('destructive');
  });
});
