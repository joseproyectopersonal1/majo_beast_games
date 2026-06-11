/**
 * Achievement checker — pure function that evaluates which achievements
 * should be unlocked based on a snapshot of the current game state.
 *
 * Source of truth: tasks_for_AI/T05 §F27.
 *
 * Returns only the IDs that are NEWLY unlocked (not already unlocked).
 * Pure — no I/O, no React, no side effects.
 */

import type { AchievementId } from './catalog';
import type { ModuleId } from '@/content/types';
import { MODULE_IDS } from '@/content/types';

/* ------------------------------------------------------------------ */
/* Snapshot shape — callers assemble this from the various stores       */
/* ------------------------------------------------------------------ */

export type AchievementSnapshot = {
  /** Already-unlocked achievement IDs (to filter out). */
  unlockedIds: readonly AchievementId[];
  /** Total correct answers ever. */
  totalCorrect: number;
  /** Best-ever answer streak. */
  bestAnswerStreak: number;
  /** Current day streak. */
  currentDayStreak: number;
  /** Best-ever day streak. */
  bestDayStreak: number;
  /** Current coin balance. */
  coins: number;
  /** Number of purchases ever made (from badges in prizeLedger — we track separately). */
  hasPurchased: boolean;
  /** Total powerups currently in inventory. */
  totalInventory: number;
  /** Per-module mastery data. */
  moduleMastery: Record<ModuleId, {
    masteredCount: number;
    inProgressCount: number;
    weakCount: number;
    masteryPercent: number;
  }>;
  /** Set of module IDs that have at least 1 answer recorded. */
  playedModules: ReadonlySet<ModuleId>;
  /** Whether any mastery bonus has been awarded (debilidad-superada). */
  hasSuperadoDebilidad: boolean;
  /** Whether jefe-final mode has been completed. */
  hasCompletedBoss: boolean;
  /** Whether jefe-final was completed with 10/10. */
  hasPerfectBoss: boolean;
  /** Whether a roulette reto has been completed. */
  hasCompletedReto: boolean;
  /** Whether BESTIAL segment was ever won. */
  hasWonBestial: boolean;
};

/* ------------------------------------------------------------------ */
/* Checker                                                             */
/* ------------------------------------------------------------------ */

/**
 * Evaluate all achievement conditions. Returns IDs that are newly unlocked
 * (i.e., condition is met AND not already in `snapshot.unlockedIds`).
 */
export function checkAchievements(snapshot: AchievementSnapshot): AchievementId[] {
  const already = new Set<AchievementId>(snapshot.unlockedIds);
  const newly: AchievementId[] = [];

  function check(id: AchievementId, condition: boolean): void {
    if (!already.has(id) && condition) {
      newly.push(id);
    }
  }

  // Juego
  check('primer-acierto', snapshot.totalCorrect >= 1);
  check('racha-5', snapshot.bestAnswerStreak >= 5);
  check('racha-10', snapshot.bestAnswerStreak >= 10);
  check('racha-20', snapshot.bestAnswerStreak >= 20);
  check('jefe-derrotado', snapshot.hasCompletedBoss);
  check('jefe-perfecto', snapshot.hasPerfectBoss);

  // Progreso
  check(
    'primer-modulo-dominado',
    MODULE_IDS.some((id) => snapshot.moduleMastery[id]?.masteryPercent === 100),
  );
  check(
    'todos-modulos-jugados',
    MODULE_IDS.every((id) => snapshot.playedModules.has(id)),
  );
  check('debilidad-superada', snapshot.hasSuperadoDebilidad);

  // sin-debilidades: a module with ≥10 seen items and 0 weak items
  check(
    'sin-debilidades',
    MODULE_IDS.some((id) => {
      const m = snapshot.moduleMastery[id];
      if (!m) return false;
      const total = m.masteredCount + m.inProgressCount + m.weakCount;
      return total >= 10 && m.weakCount === 0;
    }),
  );

  check('dias-7', snapshot.bestDayStreak >= 7);
  check('dias-30', snapshot.bestDayStreak >= 30);

  // Tienda
  check('primera-compra', snapshot.hasPurchased);
  check('coleccionista', snapshot.totalInventory >= 5);
  check('monedas-1000', snapshot.coins >= 1000);
  check('monedas-10000', snapshot.coins >= 10000);

  // Ruleta
  check('primer-reto', snapshot.hasCompletedReto);
  check('giro-bestial', snapshot.hasWonBestial);

  return newly;
}
