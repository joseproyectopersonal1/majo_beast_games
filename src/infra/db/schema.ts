/**
 * Dexie schema for Beast Games local storage.
 *
 * Source of truth: docs/hltc-beast-games.md §5 (data contracts).
 * Extended by T05 §F27 (achievements).
 *
 * Tables:
 *   v1:
 *   - settings      (singleton row, key = 'singleton')
 *   - leitnerStates (key = itemId)
 *   - prizeLedger   (singleton row, key = 'singleton')
 *   - sessionLog    (auto-increment id)
 *
 *   v2 (adds):
 *   - inventory     (key = powerupId)
 *   - streaks       (singleton row, key = 'singleton')
 *   - records       (key = key, pattern: `${moduleId}.${gameMode}`)
 *   - globalsRecord (singleton row, key = 'singleton')
 *
 * Migration: v2.stores() only lists NEW tables — Dexie preserves existing v1
 * tables automatically. All existing rows remain intact.
 */

import Dexie, { type Table } from 'dexie';
import type { LeitnerState } from '@/domain/leitner/types';
import type { PowerupId } from '@/domain/shop/powerups';
import type { ModuleId, GameMode } from '@/content/types';
import type { AchievementId } from '@/domain/achievements/catalog';

export const SINGLETON_KEY = 'singleton' as const;

export type Settings = {
  /** Always 'singleton'. */
  id: typeof SINGLETON_KEY;
  audioEnabled: boolean;
  hasOnboarded: boolean;
  /** Unix ms timestamp of the last user interaction. Used for session-close detection. */
  lastInteractionAt: number;
  /**
   * Last module the player started a game in (T04 §A — /jugar smart redirect).
   * Optional non-indexed field: no schema version bump required.
   */
  lastPlayedModule?: ModuleId;
};

export type PrizeLedger = {
  /** Always 'singleton'. */
  id: typeof SINGLETON_KEY;
  coins: number;
  gems: number;
  trophies: number;
  badges: string[];
};

export type SessionLogEntry = {
  id?: number;
  startedAt: number;
  endedAt: number;
  itemsAnswered: number;
  correct: number;
  wrong: number;
  coinsEarned: number;
};

/**
 * The Leitner state row as stored in Dexie. Schema-wise it's the same shape as
 * the domain `LeitnerState` — itemId is the primary key.
 */
export type LeitnerStateRow = LeitnerState;

/* ------------------------------------------------------------------ */
/* v2 table types                                                      */
/* ------------------------------------------------------------------ */

/** One row per owned powerup type. quantity = units owned. */
export type InventoryRow = {
  powerupId: PowerupId;
  quantity: number;
};

/** Global streaks state (singleton). */
export type StreaksRow = {
  id: typeof SINGLETON_KEY;
  currentAnswerStreak: number;
  bestAnswerStreak: number;
  bestAnswerStreakByModule: Partial<Record<ModuleId, number>>;
  lastPlayedDay: string; // 'YYYY-MM-DD' local date
  currentDayStreak: number;
  bestDayStreak: number;
  /** Item IDs that have already received the mastery-domination bonus (+500). */
  bonusedItemIds: string[];
};

/** Per-module × per-mode game records row. */
export type GameRecordRow = {
  /** Composite key: `${moduleId}.${gameMode}` */
  key: string;
  moduleId: ModuleId;
  gameMode: GameMode;
  bestScore: number;
  bestRung: number;
  playedCount: number;
};

/** Global accuracy counters (singleton). */
export type GlobalsRecordRow = {
  id: typeof SINGLETON_KEY;
  totalAnswered: number;
  totalCorrect: number;
};

/* ------------------------------------------------------------------ */
/* v3 table types (T04 — Ruleta Bestial)                               */
/* ------------------------------------------------------------------ */

/** Roulette state (singleton). Spins are EARNED only — never purchasable. */
export type RouletteRow = {
  id: typeof SINGLETON_KEY;
  /** 'YYYY-MM-DD' local date when the daily free spin was last used. '' = never. */
  lastFreeSpinDay: string;
  /** Spins earned by winning rounds (≥8/10 correct). Capped at 3. */
  earnedSpins: number;
  /** True if the x2-next prize is waiting to double the next round's coins. */
  pendingX2: boolean;
  /**
   * Segment id of a prize that was decided+persisted but not yet revealed
   * to the player (decide → persist → animate order). Null = none pending.
   */
  pendingPrizeId: string | null;
};

/* ------------------------------------------------------------------ */
/* v4 table types (T05 — Logros / Achievements)                        */
/* ------------------------------------------------------------------ */

/** One row per unlocked achievement. */
export type AchievementRow = {
  achievementId: AchievementId;
  /** Unix ms timestamp when unlocked. */
  unlockedAt: number;
};

/* ------------------------------------------------------------------ */
/* DB class                                                            */
/* ------------------------------------------------------------------ */

export class BeastGamesDB extends Dexie {
  settings!: Table<Settings, typeof SINGLETON_KEY>;
  leitnerStates!: Table<LeitnerStateRow, string>;
  prizeLedger!: Table<PrizeLedger, typeof SINGLETON_KEY>;
  sessionLog!: Table<SessionLogEntry, number>;
  inventory!: Table<InventoryRow, PowerupId>;
  streaks!: Table<StreaksRow, typeof SINGLETON_KEY>;
  records!: Table<GameRecordRow, string>;
  globalsRecord!: Table<GlobalsRecordRow, typeof SINGLETON_KEY>;
  roulette!: Table<RouletteRow, typeof SINGLETON_KEY>;
  achievements!: Table<AchievementRow, AchievementId>;

  constructor() {
    super('beast-games');
    // v1 — original tables.
    this.version(1).stores({
      settings: 'id',
      leitnerStates: 'itemId, box, lastSeenAt',
      prizeLedger: 'id',
      sessionLog: '++id, startedAt',
    });
    // v2 — additive: new tables only. Existing v1 data is preserved automatically.
    this.version(2).stores({
      inventory: 'powerupId',
      streaks: 'id',
      records: 'key',
      globalsRecord: 'id',
    });
    // v3 — additive: roulette singleton (T04). Existing data preserved.
    this.version(3).stores({
      roulette: 'id',
    });
    // v4 — additive: achievements (T05 §F27). Existing data preserved.
    this.version(4).stores({
      achievements: 'achievementId',
    });
  }
}

/**
 * Lazy singleton. Constructing Dexie in module scope at import time would
 * fail in non-browser environments (SSR build, Node tests). We instantiate
 * on first access from a browser-side caller.
 */
let _db: BeastGamesDB | null = null;
export function getDb(): BeastGamesDB {
  if (_db === null) {
    _db = new BeastGamesDB();
  }
  return _db;
}

/** For tests: reset the singleton so a fresh in-memory Dexie can be created. */
export function _resetDbForTests(): void {
  _db = null;
}

/**
 * Default rows used to bootstrap the DB on first launch.
 */
export const DEFAULT_SETTINGS: Settings = {
  id: SINGLETON_KEY,
  audioEnabled: true,
  hasOnboarded: false,
  lastInteractionAt: 0,
};

export const DEFAULT_PRIZE_LEDGER: PrizeLedger = {
  id: SINGLETON_KEY,
  coins: 0,
  gems: 0,
  trophies: 0,
  badges: [],
};

export const DEFAULT_STREAKS: StreaksRow = {
  id: SINGLETON_KEY,
  currentAnswerStreak: 0,
  bestAnswerStreak: 0,
  bestAnswerStreakByModule: {},
  lastPlayedDay: '',
  currentDayStreak: 0,
  bestDayStreak: 0,
  bonusedItemIds: [],
};

export const DEFAULT_GLOBALS_RECORD: GlobalsRecordRow = {
  id: SINGLETON_KEY,
  totalAnswered: 0,
  totalCorrect: 0,
};

export const DEFAULT_ROULETTE: RouletteRow = {
  id: SINGLETON_KEY,
  lastFreeSpinDay: '',
  earnedSpins: 0,
  pendingX2: false,
  pendingPrizeId: null,
};
