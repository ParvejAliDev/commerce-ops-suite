'use client';

import { startTransition, useEffect, useEffectEvent } from 'react';
import { useRouter } from 'next/navigation';

import { setupReportsAutoRefresh } from '@/src/modules/reports/auto-refresh';

export function ReportsAutoRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const refresh = useEffectEvent(() => {
    startTransition(() => {
      router.refresh();
    });
  });

  useEffect(() => {
    return setupReportsAutoRefresh({
      document,
      enabled,
      refresh,
    });
  }, [enabled, refresh]);

  return null;
}
