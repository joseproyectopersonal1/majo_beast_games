/**
 * useBootstrap — one-shot client bootstrap on app open.
 *
 * Source of truth: docs/hltc-beast-games.md §5.6 (sessions) + §8 (errors).
 *
 * Order:
 *   1. Check isDbAvailable.
 *   2. settings.beginSession(now) — applies stale-session decrement.
 *   3. Hydrate all stores in parallel.
 *   4. Apply day-streak for today (uses today's local ISO date).
 *   5. Preload audio.
 */

'use client';

import { useEffect, useState } from 'react';
import { isDbAvailable, settingsRepo } from '@/infra/db/repos';
import { useSettingsStore } from './useSettingsStore';
import { useProgressStore } from './useProgressStore';
import { useInventoryStore } from './useInventoryStore';
import { useStreaksStore } from './useStreaksStore';
import { useRecordsStore } from './useRecordsStore';
import { useRouletteStore } from './useRouletteStore';
import { useAchievementsStore } from './useAchievementsStore';
import { audioManager } from '@/infra/audio/manager';

export type BootstrapStatus =
  | { status: 'loading' }
  | { status: 'no-db' }
  | { status: 'ready' }
  | { status: 'error'; error: unknown };

/** Returns today's date as 'YYYY-MM-DD' in the device's local timezone. */
function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useBootstrap(): BootstrapStatus {
  const [state, setState] = useState<BootstrapStatus>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const available = await isDbAvailable();
        if (!available) {
          if (!cancelled) setState({ status: 'no-db' });
          return;
        }
        // 1. Begin session (handles decrement if stale).
        await settingsRepo.beginSession(Date.now());
        // 2. Hydrate all stores.
        await Promise.all([
          useSettingsStore.getState().loadFromDb(),
          useProgressStore.getState().loadFromDb(),
          useInventoryStore.getState().loadFromDb(),
          useStreaksStore.getState().loadFromDb(),
          useRecordsStore.getState().loadFromDb(),
          useRouletteStore.getState().loadFromDb(),
          useAchievementsStore.getState().loadFromDb(),
        ]);
        // 3. Apply day streak for today.
        await useStreaksStore.getState().applyDay(todayLocalISO());
        // 4. Preload audio (no-op if disabled).
        audioManager.preload();
        if (!cancelled) setState({ status: 'ready' });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
