/**
 * Streaks domain — pure functions for tracking answer and day streaks.
 *
 * Source of truth: tasks_for_AI/T02-beast-games-extras.md §F22.
 *
 * No I/O. Operates on plain data objects (same shape as StreaksRow).
 */

import type { ModuleId } from '@/content/types';

export type StreaksState = {
  id: 'singleton';
  /** Consecutive correct answers (global, survives across rounds and modules). */
  currentAnswerStreak: number;
  bestAnswerStreak: number;
  /** Per-module best answer streak. */
  bestAnswerStreakByModule: Partial<Record<ModuleId, number>>;
  /** Last day played in 'YYYY-MM-DD' local-date format. Empty string = never. */
  lastPlayedDay: string;
  currentDayStreak: number;
  bestDayStreak: number;
};

/** Apply a single answer result to streaks state. Returns new state (immutable). */
export function applyAnswerToStreaks(
  state: StreaksState,
  correct: boolean,
  moduleId: ModuleId,
): StreaksState {
  if (!correct) {
    return {
      ...state,
      currentAnswerStreak: 0,
    };
  }

  const newStreak = state.currentAnswerStreak + 1;
  const newBest = Math.max(state.bestAnswerStreak, newStreak);
  const prevModuleBest = state.bestAnswerStreakByModule[moduleId] ?? 0;
  const newModuleBest = Math.max(prevModuleBest, newStreak);

  return {
    ...state,
    currentAnswerStreak: newStreak,
    bestAnswerStreak: newBest,
    bestAnswerStreakByModule: {
      ...state.bestAnswerStreakByModule,
      [moduleId]: newModuleBest,
    },
  };
}

/**
 * Apply a day-played event to streaks state.
 *
 * Rules:
 * - todayISO is same as lastPlayedDay → no change (already counted today)
 * - todayISO is exactly 1 day after lastPlayedDay → streak continues
 * - otherwise (gap or first play) → streak resets to 1
 *
 * Clock skew / manual date changes are accepted as-is (no defense required).
 */
export function applyDayPlayed(state: StreaksState, todayLocalISO: string): StreaksState {
  if (state.lastPlayedDay === todayLocalISO) {
    // Already counted today.
    return state;
  }

  let currentDayStreak: number;
  if (state.lastPlayedDay !== '' && isYesterday(state.lastPlayedDay, todayLocalISO)) {
    currentDayStreak = state.currentDayStreak + 1;
  } else {
    currentDayStreak = 1;
  }

  const bestDayStreak = Math.max(state.bestDayStreak, currentDayStreak);

  return {
    ...state,
    lastPlayedDay: todayLocalISO,
    currentDayStreak,
    bestDayStreak,
  };
}

/** Return true if `prev` is exactly one calendar day before `today`. */
function isYesterday(prev: string, today: string): boolean {
  // Parse YYYY-MM-DD strings as UTC dates to avoid DST shifts on the comparison.
  const prevDate = new Date(`${prev}T00:00:00Z`);
  const todayDate = new Date(`${today}T00:00:00Z`);
  const diff = todayDate.getTime() - prevDate.getTime();
  return diff === 24 * 60 * 60 * 1000; // exactly 1 day in ms
}
