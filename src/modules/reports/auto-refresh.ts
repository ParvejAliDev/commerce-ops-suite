export const REPORTS_AUTO_REFRESH_INTERVAL_MS = 10000;

type ReportsAutoRefreshInterval =
  | ReturnType<typeof globalThis.setInterval>
  | number;

type ReportsAutoRefreshDocument = {
  visibilityState: string;
  addEventListener: (event: 'visibilitychange', listener: () => void) => void;
  removeEventListener: (
    event: 'visibilitychange',
    listener: () => void,
  ) => void;
};

export function isReportsAutoRefreshVisible(visibilityState: string): boolean {
  return visibilityState === 'visible';
}

export function setupReportsAutoRefresh(input: {
  clearIntervalFn?: (id: ReportsAutoRefreshInterval) => void;
  document: ReportsAutoRefreshDocument;
  enabled: boolean;
  intervalMs?: number;
  refresh: () => void;
  setIntervalFn?: (
    callback: () => void,
    intervalMs: number,
  ) => ReportsAutoRefreshInterval;
}): () => void {
  if (!input.enabled) {
    return () => {};
  }

  const intervalMs = input.intervalMs ?? REPORTS_AUTO_REFRESH_INTERVAL_MS;
  const setIntervalFn =
    input.setIntervalFn ??
    ((callback: () => void, intervalMs: number) =>
      globalThis.setInterval(callback, intervalMs));
  const clearIntervalFn =
    input.clearIntervalFn ??
    ((intervalId: ReportsAutoRefreshInterval) =>
      globalThis.clearInterval(
        intervalId as ReturnType<typeof globalThis.setInterval>,
      ));

  const refreshIfVisible = () => {
    if (isReportsAutoRefreshVisible(input.document.visibilityState)) {
      input.refresh();
    }
  };

  const onVisibilityChange = () => {
    refreshIfVisible();
  };

  const intervalId = setIntervalFn(refreshIfVisible, intervalMs);
  input.document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    clearIntervalFn(intervalId);
    input.document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
