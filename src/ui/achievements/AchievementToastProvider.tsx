/**
 * AchievementToastProvider — global wrapper that reads the achievement
 * toast queue from the store and renders the toast for the first item.
 *
 * Placed in the root layout inside BootstrapGate.
 */

'use client';

import { useCallback } from 'react';
import { useAchievementsStore } from '@/state/useAchievementsStore';
import { AchievementToast } from './AchievementToast';

export function AchievementToastProvider() {
  const firstInQueue = useAchievementsStore((s) => s.toastQueue[0] ?? null);
  const dismissToast = useAchievementsStore((s) => s.dismissToast);
  const onDismiss = useCallback(() => dismissToast(), [dismissToast]);

  return <AchievementToast achievementId={firstInQueue} onDismiss={onDismiss} />;
}
