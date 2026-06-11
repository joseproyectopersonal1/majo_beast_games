/**
 * ActiveEffects — resolved effects for a game round, derived from the
 * set of powerups the player activated before starting.
 *
 * Source of truth: tasks_for_AI/T02-beast-games-extras.md §F21.
 */

import type { PowerupId } from './powerups';

export type ActiveEffects = {
  /** Number of hint uses available (from 'pista'). */
  hintsAvailable: number;
  /** True if the time-freeze action is available (from 'congelar'). */
  freezeAvailable: boolean;
  /** Extra milliseconds added to each question's time limit (from 'tiempo-extra'). */
  extraTimeMs: number;
  /** Extra lives added at round start (from 'vida-extra'). */
  extraLives: number;
  /** True if the shield absorbs the first wrong answer (from 'escudo'). */
  shieldActive: boolean;
  /** Coin multiplier for the round (from 'doble-monedas'). */
  coinMultiplier: 1 | 2;
};

/** Baseline with no powerups active. */
export const NO_EFFECTS: ActiveEffects = {
  hintsAvailable: 0,
  freezeAvailable: false,
  extraTimeMs: 0,
  extraLives: 0,
  shieldActive: false,
  coinMultiplier: 1,
};

/**
 * Build resolved effects from the list of activated powerup IDs.
 * Pure function — does not touch DB or stores.
 *
 * Notes:
 * - 'pista' is per-use; each activation adds 1 hint charge.
 * - 'doble-monedas' sets multiplier to 2 (activating twice is still 2×).
 * - All other powerups are per-round toggles.
 */
export function buildEffects(activated: readonly PowerupId[]): ActiveEffects {
  let hintsAvailable = 0;
  let freezeAvailable = false;
  let extraTimeMs = 0;
  let extraLives = 0;
  let shieldActive = false;
  let coinMultiplier: 1 | 2 = 1;

  for (const id of activated) {
    switch (id) {
      case 'pista':
        hintsAvailable += 1;
        break;
      case 'congelar':
        freezeAvailable = true;
        break;
      case 'tiempo-extra':
        extraTimeMs += 5_000;
        break;
      case 'vida-extra':
        extraLives += 1;
        break;
      case 'escudo':
        shieldActive = true;
        break;
      case 'doble-monedas':
        coinMultiplier = 2;
        break;
    }
  }

  return { hintsAvailable, freezeAvailable, extraTimeMs, extraLives, shieldActive, coinMultiplier };
}
