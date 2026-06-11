/**
 * useStreaksStore — reactive cache of answer and day streaks.
 *
 * Persists via streaksRepo. Exposes actions for updating streaks
 * from game and practice flows.
 */

'use client';

import { create } from 'zustand';
import type { ModuleId } from '@/content/types';
import type { StreaksRow } from '@/infra/db/schema';
import { streaksRepo } from '@/infra/db/repos';
import {
  applyAnswerToStreaks,
  applyDayPlayed,
  type StreaksState as DomainStreaksState,
} from '@/domain/streaks/streaks';
import { DEFAULT_STREAKS } from '@/infra/db/schema';

/** Full store state = DB row + loaded flag. */
type StoreState = StreaksRow & { loaded: boolean };

type StreaksActions = {
  loadFromDb: () => Promise<void>;
  /**
   * Apply an answer result to streaks. Returns the new persisted row so the
   * caller can detect new records for celebration.
   */
  applyAnswer: (correct: boolean, moduleId: ModuleId) => Promise<StreaksRow>;
  /** Call on app open / session start with today's local ISO date. */
  applyDay: (todayLocalISO: string) => Promise<void>;
  reset: () => void;
};

const INITIAL: StoreState = {
  ...DEFAULT_STREAKS,
  loaded: false,
};

/** Extract the domain-level streaks state (no infra-only fields). */
function toDomain(row: StoreState): DomainStreaksState {
  return {
    id: 'singleton',
    currentAnswerStreak: row.currentAnswerStreak,
    bestAnswerStreak: row.bestAnswerStreak,
    bestAnswerStreakByModule: row.bestAnswerStreakByModule,
    lastPlayedDay: row.lastPlayedDay,
    currentDayStreak: row.currentDayStreak,
    bestDayStreak: row.bestDayStreak,
  };
}

export const useStreaksStore = create<StoreState & StreaksActions>(
  (set, get) => ({
    ...INITIAL,

    async loadFromDb() {
      const row = await streaksRepo.get();
      set({ ...row, loaded: true });
    },

    async applyAnswer(correct, moduleId) {
      const current = get();
      const domain = toDomain(current);
      const next = applyAnswerToStreaks(domain, correct, moduleId);
      const nextRow: StreaksRow = {
        ...next,
        bonusedItemIds: current.bonusedItemIds,
      };
      await streaksRepo.put(nextRow);
      set({ ...nextRow });
      return nextRow;
    },

    async applyDay(todayLocalISO) {
      const current = get();
      const domain = toDomain(current);
      const next = applyDayPlayed(domain, todayLocalISO);
      // No change if domain returned the same object reference.
      if (
        next.lastPlayedDay === current.lastPlayedDay &&
        next.currentDayStreak === current.currentDayStreak
      ) {
        return;
      }
      const nextRow: StreaksRow = {
        ...next,
        bonusedItemIds: current.bonusedItemIds,
      };
      await streaksRepo.put(nextRow);
      set({ ...nextRow });
    },

    reset: () => set(INITIAL),
  }),
);
