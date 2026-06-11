/**
 * useProgressStore — reactive cache of Leitner states + prize ledger
 * + per-module mastery aggregates.
 *
 * Persisted to Dexie on every mutation. Source of truth on disk is Dexie;
 * this store is the reactive read model.
 *
 * v2 additions (T02 F24):
 * - recordAnswer now returns { newState, masteryBonusAwarded }.
 * - masteryBonusAwarded = true if item transitioned fragile → mastered
 *   AND wasn't already bonused (persisted in streaks.bonusedItemIds).
 */

'use client';

import { create } from 'zustand';
import type { LeitnerState } from '@/domain/leitner/types';
import { applyAnswer } from '@/domain/leitner/engine';
import {
  moduleMastery,
  type ModuleMastery,
} from '@/domain/progress/mastery';
import { isWeak, isMastered } from '@/domain/reinforce/selection';
import { leitnerRepo, prizeRepo, streaksRepo } from '@/infra/db/repos';
import type { PrizeLedger } from '@/infra/db/schema';
import {
  MODULE_IDS,
  type ModuleId,
} from '@/content/types';

/** Coin bonus awarded when a fragile item reaches mastery. */
export const MASTERY_BONUS_COINS = 500;

type ProgressState = {
  statesByItem: Record<string, LeitnerState>;
  prizeLedger: PrizeLedger;
  moduleMastery: Record<ModuleId, ModuleMastery>;
  loaded: boolean;
};

type ProgressActions = {
  loadFromDb: () => Promise<void>;
  /**
   * Record an answer in-memory and persist. Returns the new state and
   * whether a mastery bonus was awarded (fragile → mastered transition).
   */
  recordAnswer: (
    itemId: string,
    moduleId: ModuleId,
    correct: boolean,
    now: number,
  ) => Promise<{ newState: LeitnerState; masteryBonusAwarded: boolean }>;
  /** Add coins to ledger (e.g. from a game round). */
  addCoins: (amount: number) => Promise<void>;
  addTrophy: () => Promise<void>;
  /** Bulk apply (e.g. end-of-round). */
  applyBulk: (states: readonly LeitnerState[]) => Promise<void>;
  reset: () => void;
};

const emptyMastery = (): Record<ModuleId, ModuleMastery> => {
  const out = {} as Record<ModuleId, ModuleMastery>;
  for (const id of MODULE_IDS) {
    out[id] = {
      masteredCount: 0,
      inProgressCount: 0,
      weakCount: 0,
      masteryPercent: 0,
    };
  }
  return out;
};

const INITIAL: ProgressState = {
  statesByItem: {},
  prizeLedger: {
    id: 'singleton',
    coins: 0,
    gems: 0,
    trophies: 0,
    badges: [],
  },
  moduleMastery: emptyMastery(),
  loaded: false,
};

function recomputeMastery(
  statesByItem: Record<string, LeitnerState>,
): Record<ModuleId, ModuleMastery> {
  const buckets: Record<ModuleId, LeitnerState[]> = {} as Record<ModuleId, LeitnerState[]>;
  for (const id of MODULE_IDS) buckets[id] = [];
  for (const s of Object.values(statesByItem)) {
    const dot = s.itemId.indexOf('.');
    if (dot < 0) continue;
    const prefix = s.itemId.slice(0, dot) as ModuleId;
    if (buckets[prefix]) buckets[prefix].push(s);
  }
  const out = {} as Record<ModuleId, ModuleMastery>;
  for (const id of MODULE_IDS) out[id] = moduleMastery(buckets[id]);
  return out;
}

export const useProgressStore = create<ProgressState & ProgressActions>(
  (set, get) => ({
    ...INITIAL,

    async loadFromDb() {
      const [states, ledger] = await Promise.all([
        leitnerRepo.getAll(),
        prizeRepo.get(),
      ]);
      const statesByItem: Record<string, LeitnerState> = {};
      for (const s of states) statesByItem[s.itemId] = s;
      set({
        statesByItem,
        prizeLedger: ledger,
        moduleMastery: recomputeMastery(statesByItem),
        loaded: true,
      });
    },

    async recordAnswer(itemId, _moduleId, correct, now) {
      const prev = get().statesByItem[itemId] ?? {
        itemId,
        box: 0,
        sessionsUntilReview: 0,
        consecutiveCorrect: 0,
        totalSeen: 0,
        totalWrong: 0,
        lastSeenAt: 0,
      };
      const next = applyAnswer(prev, correct, now);
      await leitnerRepo.put(next);
      const nextStates = { ...get().statesByItem, [itemId]: next };
      set({
        statesByItem: nextStates,
        moduleMastery: recomputeMastery(nextStates),
      });

      // F24: detect fragile → mastered transition and award bonus (once per item).
      let masteryBonusAwarded = false;
      if (correct && isWeak(prev) && isMastered(next)) {
        const streaksRow = await streaksRepo.get();
        if (!streaksRow.bonusedItemIds.includes(itemId)) {
          const updatedStreaks = {
            ...streaksRow,
            bonusedItemIds: [...streaksRow.bonusedItemIds, itemId],
          };
          await Promise.all([
            streaksRepo.put(updatedStreaks),
            prizeRepo.addCoins(MASTERY_BONUS_COINS),
          ]);
          const newLedger = await prizeRepo.get();
          set({ prizeLedger: newLedger });
          masteryBonusAwarded = true;
        }
      }

      return { newState: next, masteryBonusAwarded };
    },

    async addCoins(amount) {
      const ledger = await prizeRepo.addCoins(amount);
      set({ prizeLedger: ledger });
    },

    async addTrophy() {
      const ledger = await prizeRepo.addTrophy();
      set({ prizeLedger: ledger });
    },

    async applyBulk(states) {
      await leitnerRepo.bulkApply(states);
      const merged = { ...get().statesByItem };
      for (const s of states) merged[s.itemId] = s;
      set({
        statesByItem: merged,
        moduleMastery: recomputeMastery(merged),
      });
    },

    reset: () => set(INITIAL),
  }),
);
