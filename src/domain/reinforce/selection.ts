/**
 * Reinforce domain — selection of weak items for the "Zona de Refuerzo".
 *
 * Source of truth: tasks_for_AI/T02-beast-games-extras.md §F24.
 *
 * Reuses the weak-item classification from mastery.ts.
 * No I/O. Pure functions.
 */

import type { LeitnerState } from '@/domain/leitner/types';
import type { ModuleId } from '@/content/types';

/**
 * Thresholds for the "weak" classification (same as mastery.ts).
 * Extracted here as named constants to avoid duplicating magic numbers.
 */
export const WEAK_MIN_WRONG = 2;
export const WEAK_MAX_BOX = 1;

/**
 * Thresholds for the "mastered" classification (same as mastery.ts).
 */
export const MASTERED_MIN_BOX = 3;
export const MASTERED_MIN_CONSECUTIVE = 3;

/** True if the given state is currently in the weak zone. */
export function isWeak(state: LeitnerState): boolean {
  return state.totalWrong >= WEAK_MIN_WRONG && state.box <= WEAK_MAX_BOX;
}

/** True if the given state is currently mastered. */
export function isMastered(state: LeitnerState): boolean {
  return state.box >= MASTERED_MIN_BOX && state.consecutiveCorrect >= MASTERED_MIN_CONSECUTIVE;
}

/**
 * Returns the IDs of all weak items in the given module.
 *
 * @param states  All Leitner states (can include other modules — filtered by moduleId).
 * @param moduleId  The module to filter by.
 */
export function weakItemsOf(
  states: readonly LeitnerState[],
  moduleId: ModuleId,
): string[] {
  return states
    .filter((s) => s.itemId.startsWith(`${moduleId}.`) && isWeak(s))
    .map((s) => s.itemId);
}

/**
 * Sort Leitner states for reinforce practice.
 *
 * Order: totalWrong descending (most-wrong first), then box ascending (lowest box first).
 * Returns a new array; does not mutate the input.
 */
export function sortForReinforce(states: readonly LeitnerState[]): LeitnerState[] {
  return [...states].sort((a, b) => {
    if (b.totalWrong !== a.totalWrong) return b.totalWrong - a.totalWrong;
    return a.box - b.box;
  });
}
