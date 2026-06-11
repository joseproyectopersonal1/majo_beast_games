/**
 * useGameStore — state of the round currently being played.
 *
 * Source of truth: docs/hltc-beast-games.md §4.1 (State layer).
 *
 * This store is intentionally ephemeral: it lives in memory while a round is
 * being played and is wiped on `endGame`. Persistence happens via the
 * progress store at round end.
 *
 * v2 additions (T02):
 * - activeEffects: powerup effects applied to this round.
 * - shieldConsumed: tracks whether the shield absorbed a hit.
 * - freezeUsed: prevents using the time-freeze more than once per round.
 * - useHint(): consumes one hint charge and returns true if available.
 * - freezeTimer(): pauses the timer for 10s (once per round).
 * - coinMultiplier exposed for GameScreen when adding coins per answer.
 */

'use client';

import { create } from 'zustand';
import type { ModuleId, GameMode, Item } from '@/content/types';
import { checkAnswer, type UserResponse } from '@/domain/validation/answer';
import { applyAnswer } from '@/domain/leitner/engine';
import type { LeitnerState } from '@/domain/leitner/types';
import { type ActiveEffects, NO_EFFECTS } from '@/domain/shop/effects';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

export type AnsweredItem = {
  itemId: string;
  correct: boolean;
  /** New Leitner state after applying the answer. Persisted on endGame. */
  newState: LeitnerState;
};

type GameState = {
  moduleId: ModuleId | null;
  gameMode: GameMode | null;
  items: readonly Item[];
  /** Current item being asked. Null between rounds. */
  currentItem: Item | null;
  /** 0-based rung in the prize ladder (0..9). */
  rung: number;
  lives: number;
  streak: number;
  bestStreak: number;
  /** Milliseconds remaining on the current question; null = no timer. */
  timeLeft: number | null;
  /** Coins earned in this round (transient — pushed to ledger at endGame). */
  score: number;
  status: GameStatus;
  answered: AnsweredItem[];
  /** Active powerup effects for this round. */
  activeEffects: ActiveEffects;
  /** True after the shield has absorbed its one hit. */
  shieldConsumed: boolean;
  /** True after the time-freeze has been used this round. */
  freezeUsed: boolean;
};

type GameActions = {
  startGame: (params: {
    moduleId: ModuleId;
    gameMode: GameMode;
    items: readonly Item[];
    firstItem: Item;
    lives?: number;
    timeLimitMs?: number;
    effects?: ActiveEffects;
  }) => void;
  setCurrentItem: (item: Item) => void;
  answer: (
    response: UserResponse,
    currentLeitnerState: LeitnerState,
    now: number,
  ) => { correct: boolean; expected: string; shieldAbsorbed: boolean };
  tickTimer: (deltaMs: number) => void;
  /** Pause the timer for 10 seconds (once per round). Returns false if not available. */
  freezeTimer: () => boolean;
  /**
   * Consume one hint charge. Returns true if a hint was available.
   * The UI is responsible for showing the hint content when true is returned.
   */
  useHint: () => boolean;
  pause: () => void;
  resume: () => void;
  endGame: () => void;
  reset: () => void;
};

const INITIAL: GameState = {
  moduleId: null,
  gameMode: null,
  items: [],
  currentItem: null,
  rung: 0,
  lives: 3,
  streak: 0,
  bestStreak: 0,
  timeLeft: null,
  score: 0,
  status: 'idle',
  answered: [],
  activeEffects: NO_EFFECTS,
  shieldConsumed: false,
  freezeUsed: false,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...INITIAL,

  startGame: ({ moduleId, gameMode, items, firstItem, lives = 3, timeLimitMs, effects }) => {
    const fx = effects ?? NO_EFFECTS;
    set({
      ...INITIAL,
      moduleId,
      gameMode,
      items,
      currentItem: firstItem,
      lives: lives + fx.extraLives,
      timeLeft: timeLimitMs != null ? timeLimitMs + fx.extraTimeMs : null,
      status: 'playing',
      activeEffects: fx,
    });
  },

  setCurrentItem: (item) => set({ currentItem: item }),

  answer: (response, currentLeitnerState, now) => {
    const s = get();
    if (!s.currentItem || s.status !== 'playing') {
      throw new Error('answer() called outside of a playing round');
    }
    const { correct, expected } = checkAnswer(s.currentItem.answer, response);
    const newLeitner = applyAnswer(currentLeitnerState, correct, now);

    // Shield logic: first wrong answer → absorb (no life loss, no streak reset).
    const shieldAbsorbs =
      !correct && s.activeEffects.shieldActive && !s.shieldConsumed;

    const newStreak = correct ? s.streak + 1 : shieldAbsorbs ? s.streak : 0;
    const livesAfter = correct || shieldAbsorbs ? s.lives : s.lives - 1;
    const rungAfter = correct ? Math.min(s.rung + 1, 9) : s.rung;

    // Score accumulation (pre-multiplier; multiplier applied by GameScreen at addCoins time).
    const coinsThisAnswer = correct ? currentLeitnerState.box * 10 + 50 : 0;

    set({
      streak: newStreak,
      bestStreak: Math.max(s.bestStreak, newStreak),
      lives: livesAfter,
      rung: rungAfter,
      score: s.score + coinsThisAnswer,
      shieldConsumed: shieldAbsorbs ? true : s.shieldConsumed,
      answered: [
        ...s.answered,
        { itemId: s.currentItem.id, correct, newState: newLeitner },
      ],
    });
    return { correct, expected, shieldAbsorbed: shieldAbsorbs };
  },

  tickTimer: (deltaMs) => {
    const s = get();
    if (s.timeLeft === null || s.status !== 'playing') return;
    const next = s.timeLeft - deltaMs;
    set({ timeLeft: Math.max(0, next) });
  },

  freezeTimer: () => {
    const s = get();
    if (!s.activeEffects.freezeAvailable || s.freezeUsed || s.status !== 'playing') {
      return false;
    }
    set({ freezeUsed: true, timeLeft: (s.timeLeft ?? 0) + 10_000 });
    return true;
  },

  useHint: () => {
    const s = get();
    const available = s.activeEffects.hintsAvailable;
    if (available <= 0) return false;
    set({
      activeEffects: {
        ...s.activeEffects,
        hintsAvailable: available - 1,
      },
    });
    return true;
  },

  pause: () => set({ status: 'paused' }),
  resume: () => set({ status: 'playing' }),
  endGame: () => set({ status: 'finished' }),
  reset: () => set(INITIAL),
}));
