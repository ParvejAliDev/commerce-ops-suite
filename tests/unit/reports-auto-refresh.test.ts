import { describe, expect, it, vi } from 'vitest';

import {
  REPORTS_AUTO_REFRESH_INTERVAL_MS,
  setupReportsAutoRefresh,
} from '../../src/modules/reports/auto-refresh';

describe('setupReportsAutoRefresh', () => {
  it('refreshes only while enabled and visible, then cleans up listeners', () => {
    let visibilityState = 'hidden';
    let intervalCallback: (() => void) | undefined;

    const listeners = new Map<string, () => void>();
    const document = {
      get visibilityState() {
        return visibilityState;
      },
      addEventListener: vi.fn((event: string, listener: () => void) => {
        listeners.set(event, listener);
      }),
      removeEventListener: vi.fn((event: string) => {
        listeners.delete(event);
      }),
    };
    const refresh = vi.fn();
    const setIntervalFn = vi.fn((callback: () => void, intervalMs: number) => {
      intervalCallback = callback;
      expect(intervalMs).toBe(REPORTS_AUTO_REFRESH_INTERVAL_MS);
      return 42 as unknown as ReturnType<typeof setInterval>;
    });
    const clearIntervalFn = vi.fn();

    const cleanup = setupReportsAutoRefresh({
      clearIntervalFn,
      document,
      enabled: true,
      refresh,
      setIntervalFn,
    });

    intervalCallback?.();
    expect(refresh).not.toHaveBeenCalled();

    visibilityState = 'visible';
    intervalCallback?.();
    expect(refresh).toHaveBeenCalledTimes(1);

    listeners.get('visibilitychange')?.();
    expect(refresh).toHaveBeenCalledTimes(2);

    cleanup();
    expect(clearIntervalFn).toHaveBeenCalledWith(42);
    expect(document.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('does nothing when auto-refresh is disabled', () => {
    const document = {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const refresh = vi.fn();
    const setIntervalFn = vi.fn();
    const clearIntervalFn = vi.fn();

    const cleanup = setupReportsAutoRefresh({
      clearIntervalFn,
      document,
      enabled: false,
      refresh,
      setIntervalFn,
    });

    expect(setIntervalFn).not.toHaveBeenCalled();
    expect(document.addEventListener).not.toHaveBeenCalled();

    cleanup();
    expect(clearIntervalFn).not.toHaveBeenCalled();
  });
});
