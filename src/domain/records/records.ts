/**
 * Records domain — pure functions for tracking per-module game records.
 *
 * Source of truth: tasks_for_AI/T02-beast-games-extras.md §F23.
 *
 * No I/O. Operates on plain data objects.
 */

import type { ModuleId, GameMode } from '@/content/types';

export type GameRecord = {
  /** Composite key: `${moduleId}.${gameMode}` */
  key: string;
  moduleId: ModuleId;
  gameMode: GameMode;
  bestScore: number;
  bestRung: number;
  playedCount: number;
};

export type GlobalsRecord = {
  id: 'singleton';
  totalAnswered: number;
  totalCorrect: number;
};

/**
 * Update a game record after a completed round.
 *
 * @param prev   Existing record for this module+mode, or null on first play.
 * @param roundScore  Total coins earned in the round.
 * @param maxRung     Highest 0-based rung reached (0..9).
 * @param moduleId    For constructing the key on first play.
 * @param gameMode    For constructing the key on first play.
 * @returns New (or updated) record.
 */
export function updateRecordAfterRound(
  prev: GameRecord | null,
  roundScore: number,
  maxRung: number,
  moduleId: ModuleId,
  gameMode: GameMode,
): GameRecord {
  if (prev === null) {
    return {
      key: `${moduleId}.${gameMode}`,
      moduleId,
      gameMode,
      bestScore: roundScore,
      bestRung: maxRung,
      playedCount: 1,
    };
  }
  return {
    ...prev,
    bestScore: Math.max(prev.bestScore, roundScore),
    bestRung: Math.max(prev.bestRung, maxRung),
    playedCount: prev.playedCount + 1,
  };
}

/**
 * Compute accuracy as an integer percentage (0–100).
 * Returns 0 if no answers have been recorded yet.
 */
export function accuracyPercent(globals: GlobalsRecord): number {
  if (globals.totalAnswered === 0) return 0;
  return Math.round((100 * globals.totalCorrect) / globals.totalAnswered);
}
