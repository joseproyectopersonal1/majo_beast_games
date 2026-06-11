/**
 * useAchievementsStore — reactive cache of unlocked achievements.
 *
 * Source of truth: tasks_for_AI/T05 §F27.
 *
 * Hydrated from Dexie at bootstrap. Provides `checkAndUnlock()` which
 * assembles the snapshot from all other stores, runs the pure checker,
 * and persists any newly unlocked achievements.
 */

'use client';

import { create } from 'zustand';
import type { AchievementId } from '@/domain/achievements/catalog';
import { checkAchievements, type AchievementSnapshot } from '@/domain/achievements/check';
import { achievementsRepo } from '@/infra/db/repos';
import { useProgressStore } from './useProgressStore';
import { useStreaksStore } from './useStreaksStore';
import { useInventoryStore } from './useInventoryStore';
import { MODULE_IDS, type ModuleId } from '@/content/types';

type AchievementsState = {
  unlockedIds: AchievementId[];
  /** Timestamps per achievement (for display). */
  unlockedAt: Partial<Record<AchievementId, number>>;
  loaded: boolean;
  /** Queue of recently unlocked IDs for toast display. */
  toastQueue: AchievementId[];
  // Flags for achievements that need external signals:
  hasCompletedBoss: boolean;
  hasPerfectBoss: boolean;
  hasCompletedReto: boolean;
  hasWonBestial: boolean;
  hasPurchased: boolean;
};

type AchievementsActions = {
  loadFromDb: () => Promise<void>;
  /**
   * Check all achievement conditions against current state and unlock new ones.
   * Returns the IDs that were newly unlocked.
   */
  checkAndUnlock: () => Promise<AchievementId[]>;
  /** Signal that a boss mode was completed. */
  signalBossComplete: (perfect: boolean) => void;
  /** Signal that a roulette reto was completed. */
  signalRetoComplete: () => void;
  /** Signal that BESTIAL was won. */
  signalBestial: () => void;
  /** Signal that a purchase was made. */
  signalPurchase: () => void;
  /** Dismiss a toast from the queue. */
  dismissToast: () => void;
  reset: () => void;
};

const INITIAL: AchievementsState = {
  unlockedIds: [],
  unlockedAt: {},
  loaded: false,
  toastQueue: [],
  hasCompletedBoss: false,
  hasPerfectBoss: false,
  hasCompletedReto: false,
  hasWonBestial: false,
  hasPurchased: false,
};

export const useAchievementsStore = create<AchievementsState & AchievementsActions>(
  (set, get) => ({
    ...INITIAL,

    async loadFromDb() {
      const rows = await achievementsRepo.getAll();
      const ids = rows.map((r) => r.achievementId);
      const at: Partial<Record<AchievementId, number>> = {};
      for (const r of rows) at[r.achievementId] = r.unlockedAt;

      // If primera-compra is unlocked, mark hasPurchased.
      const hasPurchased = ids.includes('primera-compra');
      const hasCompletedBoss = ids.includes('jefe-derrotado');
      const hasPerfectBoss = ids.includes('jefe-perfecto');
      const hasCompletedReto = ids.includes('primer-reto');
      const hasWonBestial = ids.includes('giro-bestial');

      set({
        unlockedIds: ids,
        unlockedAt: at,
        loaded: true,
        hasPurchased,
        hasCompletedBoss,
        hasPerfectBoss,
        hasCompletedReto,
        hasWonBestial,
      });
    },

    async checkAndUnlock() {
      const state = get();
      const progressState = useProgressStore.getState();
      const streaksState = useStreaksStore.getState();
      const inventoryState = useInventoryStore.getState();

      // Build played modules set from statesByItem
      const playedModules = new Set<ModuleId>();
      for (const itemId of Object.keys(progressState.statesByItem)) {
        const dot = itemId.indexOf('.');
        if (dot < 0) continue;
        const prefix = itemId.slice(0, dot) as ModuleId;
        if ((MODULE_IDS as readonly string[]).includes(prefix)) {
          playedModules.add(prefix);
        }
      }

      // Count total inventory
      const totalInventory = Object.values(inventoryState.quantities).reduce(
        (sum, q) => sum + q,
        0,
      );

      // Check if any mastery bonus was awarded
      const hasSuperadoDebilidad = streaksState.bonusedItemIds.length > 0;

      const snapshot: AchievementSnapshot = {
        unlockedIds: state.unlockedIds,
        totalCorrect: progressState.prizeLedger.trophies > 0
          ? 1 // If they have trophies they definitely answered correctly
          : Object.values(progressState.statesByItem).reduce(
            (sum, s) => sum + (s.totalSeen - s.totalWrong),
            0,
          ),
        bestAnswerStreak: streaksState.bestAnswerStreak,
        currentDayStreak: streaksState.currentDayStreak,
        bestDayStreak: streaksState.bestDayStreak,
        coins: progressState.prizeLedger.coins,
        hasPurchased: state.hasPurchased,
        totalInventory,
        moduleMastery: progressState.moduleMastery,
        playedModules,
        hasSuperadoDebilidad,
        hasCompletedBoss: state.hasCompletedBoss,
        hasPerfectBoss: state.hasPerfectBoss,
        hasCompletedReto: state.hasCompletedReto,
        hasWonBestial: state.hasWonBestial,
      };

      const newlyUnlocked = checkAchievements(snapshot);
      if (newlyUnlocked.length === 0) return [];

      // Persist
      const now = Date.now();
      await achievementsRepo.unlock(newlyUnlocked, now);

      // Update reactive state
      const newAt = { ...state.unlockedAt };
      for (const id of newlyUnlocked) newAt[id] = now;

      set({
        unlockedIds: [...state.unlockedIds, ...newlyUnlocked],
        unlockedAt: newAt,
        toastQueue: [...state.toastQueue, ...newlyUnlocked],
      });

      return newlyUnlocked;
    },

    signalBossComplete(perfect) {
      set((s) => ({
        hasCompletedBoss: true,
        hasPerfectBoss: s.hasPerfectBoss || perfect,
      }));
    },

    signalRetoComplete() {
      set({ hasCompletedReto: true });
    },

    signalBestial() {
      set({ hasWonBestial: true });
    },

    signalPurchase() {
      set({ hasPurchased: true });
    },

    dismissToast() {
      set((s) => ({ toastQueue: s.toastQueue.slice(1) }));
    },

    reset: () => set(INITIAL),
  }),
);
