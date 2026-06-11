/**
 * Repositories — typed wrappers over Dexie tables.
 *
 * Source of truth: docs/hltc-beast-games.md §4.1 (Infra layer ownership).
 *
 * Boundary rule: this module is the ONLY place that touches Dexie tables.
 * The state layer calls repos; the UI layer never imports from here directly.
 */

import {
  getDb,
  DEFAULT_SETTINGS,
  DEFAULT_PRIZE_LEDGER,
  DEFAULT_STREAKS,
  DEFAULT_GLOBALS_RECORD,
  SINGLETON_KEY,
  type LeitnerStateRow,
  type PrizeLedger,
  type SessionLogEntry,
  type Settings,
  type InventoryRow,
  type StreaksRow,
  type GameRecordRow,
  type GlobalsRecordRow,
  type RouletteRow,
  DEFAULT_ROULETTE,
  type AchievementRow,
} from './schema';
import { initialState } from '@/domain/leitner/engine';
import {
  decrementSessionIntervals,
  isSessionClosed,
} from '@/domain/leitner/session';
import type { ItemId, LeitnerState } from '@/domain/leitner/types';
import type { PowerupId } from '@/domain/shop/powerups';
import { powerupById } from '@/domain/shop/powerups';
import type { ModuleId, GameMode } from '@/content/types';
import type { AchievementId } from '@/domain/achievements/catalog';

/* ------------------------------------------------------------------ */
/* Settings repo                                                       */
/* ------------------------------------------------------------------ */

export const settingsRepo = {
  async get(): Promise<Settings> {
    const row = await getDb().settings.get(SINGLETON_KEY);
    if (row) return row;
    // First-ever read: seed defaults.
    await getDb().settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },

  async setAudio(enabled: boolean): Promise<void> {
    await getDb().settings.update(SINGLETON_KEY, { audioEnabled: enabled });
  },

  async markOnboarded(): Promise<void> {
    await getDb().settings.update(SINGLETON_KEY, { hasOnboarded: true });
  },

  /** T04 §A.3 — remember the last module the player started a game in. */
  async setLastPlayedModule(moduleId: ModuleId): Promise<void> {
    await getDb().settings.update(SINGLETON_KEY, { lastPlayedModule: moduleId });
  },

  /**
   * T4.5 — Called on app open. Returns the current settings AFTER applying
   * any pending session decrement, so callers don't need a second round-trip.
   *
   * Behavior: if elapsed time since lastInteractionAt exceeds the session
   * timeout, run `decrementSessionIntervals` against all Leitner states once,
   * then update lastInteractionAt to now.
   */
  async beginSession(now: number): Promise<Settings> {
    const current = await settingsRepo.get();
    if (current.lastInteractionAt > 0 && isSessionClosed(current.lastInteractionAt, now)) {
      const all = await leitnerRepo.getAll();
      const decremented = decrementSessionIntervals(all);
      await leitnerRepo.bulkApply(decremented);
    }
    await getDb().settings.update(SINGLETON_KEY, { lastInteractionAt: now });
    return { ...current, lastInteractionAt: now };
  },

  /** Mark that the user is still interacting (call on each meaningful action). */
  async touch(now: number): Promise<void> {
    await getDb().settings.update(SINGLETON_KEY, { lastInteractionAt: now });
  },

  /** Destructive — wipes everything. Used by "Reset progress" in Ajustes. */
  async hardReset(): Promise<void> {
    await getDb().transaction(
      'rw',
      [
        getDb().settings,
        getDb().leitnerStates,
        getDb().prizeLedger,
        getDb().sessionLog,
        getDb().inventory,
        getDb().streaks,
        getDb().records,
        getDb().globalsRecord,
        getDb().roulette,
        getDb().achievements,
      ],
      async () => {
        await getDb().settings.clear();
        await getDb().leitnerStates.clear();
        await getDb().prizeLedger.clear();
        await getDb().sessionLog.clear();
        await getDb().inventory.clear();
        await getDb().streaks.clear();
        await getDb().records.clear();
        await getDb().globalsRecord.clear();
        await getDb().roulette.clear();
        await getDb().achievements.clear();
      },
    );
  },
};

/* ------------------------------------------------------------------ */
/* Leitner repo                                                        */
/* ------------------------------------------------------------------ */

export const leitnerRepo = {
  async getAll(): Promise<LeitnerStateRow[]> {
    return getDb().leitnerStates.toArray();
  },

  async getByModule(moduleIdPrefix: string): Promise<LeitnerStateRow[]> {
    return getDb()
      .leitnerStates.where('itemId')
      .startsWith(`${moduleIdPrefix}.`)
      .toArray();
  },

  /**
   * T4.3 — Get a state, or create+persist a fresh one if it doesn't exist.
   */
  async getOrInit(itemId: ItemId): Promise<LeitnerStateRow> {
    const existing = await getDb().leitnerStates.get(itemId);
    if (existing) return existing;
    const fresh = initialState(itemId);
    await getDb().leitnerStates.put(fresh);
    return fresh;
  },

  async put(state: LeitnerState): Promise<void> {
    await getDb().leitnerStates.put(state);
  },

  /**
   * T4.4 — Atomic bulk update. Called at the end of each game round so all
   * answered items persist together.
   */
  async bulkApply(updates: readonly LeitnerState[]): Promise<void> {
    if (updates.length === 0) return;
    await getDb().leitnerStates.bulkPut(updates as LeitnerState[]);
  },
};

/* ------------------------------------------------------------------ */
/* Prize ledger repo                                                   */
/* ------------------------------------------------------------------ */

export const prizeRepo = {
  async get(): Promise<PrizeLedger> {
    const row = await getDb().prizeLedger.get(SINGLETON_KEY);
    if (row) return row;
    await getDb().prizeLedger.put(DEFAULT_PRIZE_LEDGER);
    return DEFAULT_PRIZE_LEDGER;
  },

  async addCoins(amount: number): Promise<PrizeLedger> {
    const ledger = await prizeRepo.get();
    const next = { ...ledger, coins: ledger.coins + amount };
    await getDb().prizeLedger.put(next);
    return next;
  },

  async addGems(amount: number): Promise<PrizeLedger> {
    const ledger = await prizeRepo.get();
    const next = { ...ledger, gems: ledger.gems + amount };
    await getDb().prizeLedger.put(next);
    return next;
  },

  async addTrophy(): Promise<PrizeLedger> {
    const ledger = await prizeRepo.get();
    const next = { ...ledger, trophies: ledger.trophies + 1 };
    await getDb().prizeLedger.put(next);
    return next;
  },

  async addBadge(badgeId: string): Promise<PrizeLedger> {
    const ledger = await prizeRepo.get();
    if (ledger.badges.includes(badgeId)) return ledger;
    const next = { ...ledger, badges: [...ledger.badges, badgeId] };
    await getDb().prizeLedger.put(next);
    return next;
  },
};

/* ------------------------------------------------------------------ */
/* Session log repo                                                    */
/* ------------------------------------------------------------------ */

export const sessionLogRepo = {
  async append(entry: Omit<SessionLogEntry, 'id'>): Promise<number> {
    const id = await getDb().sessionLog.add(entry as SessionLogEntry);
    return id as number;
  },

  async recent(limit = 50): Promise<SessionLogEntry[]> {
    return getDb()
      .sessionLog.orderBy('startedAt')
      .reverse()
      .limit(limit)
      .toArray();
  },
};

/* ------------------------------------------------------------------ */
/* Inventory repo (v2)                                                 */
/* ------------------------------------------------------------------ */

/** Typed error for insufficient coins during purchase. */
export class InsufficientCoinsError extends Error {
  constructor(required: number, available: number) {
    super(`Monedas insuficientes: necesitas ${required}, tienes ${available}`);
    this.name = 'InsufficientCoinsError';
  }
}

export const inventoryRepo = {
  async getAll(): Promise<InventoryRow[]> {
    return getDb().inventory.toArray();
  },

  async quantityOf(id: PowerupId): Promise<number> {
    const row = await getDb().inventory.get(id);
    return row?.quantity ?? 0;
  },

  async add(id: PowerupId, n: number): Promise<void> {
    await getDb().transaction('rw', getDb().inventory, async () => {
      const existing = await getDb().inventory.get(id);
      if (existing) {
        await getDb().inventory.put({ powerupId: id, quantity: existing.quantity + n });
      } else {
        await getDb().inventory.put({ powerupId: id, quantity: n });
      }
    });
  },

  async consume(id: PowerupId, n: number): Promise<void> {
    await getDb().transaction('rw', getDb().inventory, async () => {
      const existing = await getDb().inventory.get(id);
      const current = existing?.quantity ?? 0;
      if (current < n) {
        throw new Error(`No tienes suficientes "${id}" (tienes ${current}, necesitas ${n})`);
      }
      await getDb().inventory.put({ powerupId: id, quantity: current - n });
    });
  },
};

/**
 * Atomic purchase: deduct coins from prizeLedger and add 1 unit to inventory.
 * Throws InsufficientCoinsError if balance is too low. No partial effects.
 */
export async function purchasePowerup(id: PowerupId): Promise<void> {
  const powerup = powerupById(id);
  await getDb().transaction('rw', [getDb().prizeLedger, getDb().inventory], async () => {
    // Read ledger (seed if needed — inside transaction).
    let ledger = await getDb().prizeLedger.get(SINGLETON_KEY);
    if (!ledger) {
      ledger = DEFAULT_PRIZE_LEDGER;
      await getDb().prizeLedger.put(ledger);
    }
    if (ledger.coins < powerup.price) {
      throw new InsufficientCoinsError(powerup.price, ledger.coins);
    }
    // Deduct coins.
    await getDb().prizeLedger.put({ ...ledger, coins: ledger.coins - powerup.price });
    // Add 1 unit.
    const existing = await getDb().inventory.get(id);
    if (existing) {
      await getDb().inventory.put({ powerupId: id, quantity: existing.quantity + 1 });
    } else {
      await getDb().inventory.put({ powerupId: id, quantity: 1 });
    }
  });
}

/* ------------------------------------------------------------------ */
/* Streaks repo (v2)                                                   */
/* ------------------------------------------------------------------ */

export const streaksRepo = {
  async get(): Promise<StreaksRow> {
    const row = await getDb().streaks.get(SINGLETON_KEY);
    if (row) return row;
    await getDb().streaks.put(DEFAULT_STREAKS);
    return DEFAULT_STREAKS;
  },

  async put(state: StreaksRow): Promise<void> {
    await getDb().streaks.put(state);
  },
};

/* ------------------------------------------------------------------ */
/* Records repo (v2)                                                   */
/* ------------------------------------------------------------------ */

export const recordsRepo = {
  async getRecord(moduleId: ModuleId, gameMode: GameMode): Promise<GameRecordRow | null> {
    const key = `${moduleId}.${gameMode}`;
    return (await getDb().records.get(key)) ?? null;
  },

  async getAllRecords(): Promise<GameRecordRow[]> {
    return getDb().records.toArray();
  },

  async putRecord(row: GameRecordRow): Promise<void> {
    await getDb().records.put(row);
  },

  async getGlobals(): Promise<GlobalsRecordRow> {
    const row = await getDb().globalsRecord.get(SINGLETON_KEY);
    if (row) return row;
    await getDb().globalsRecord.put(DEFAULT_GLOBALS_RECORD);
    return DEFAULT_GLOBALS_RECORD;
  },

  async putGlobals(row: GlobalsRecordRow): Promise<void> {
    await getDb().globalsRecord.put(row);
  },
};

/* ------------------------------------------------------------------ */
/* Roulette repo (v3 — T04)                                            */
/* ------------------------------------------------------------------ */

/** Max earned spins that can be stored. The daily free spin does NOT stack. */
export const MAX_EARNED_SPINS = 3;

export const rouletteRepo = {
  async get(): Promise<RouletteRow> {
    const row = await getDb().roulette.get(SINGLETON_KEY);
    if (row) return row;
    await getDb().roulette.put(DEFAULT_ROULETTE);
    return DEFAULT_ROULETTE;
  },

  async put(row: RouletteRow): Promise<void> {
    await getDb().roulette.put(row);
  },

  /**
   * Available spins for the given local day:
   * the daily free spin (if not used today) + stored earned spins.
   */
  async availableSpins(todayLocal: string): Promise<number> {
    const row = await rouletteRepo.get();
    const daily = row.lastFreeSpinDay !== todayLocal ? 1 : 0;
    return daily + row.earnedSpins;
  },

  /**
   * Consume one spin. Priority: daily free spin first, then earned spins.
   * Throws if no spins are available. Atomic.
   */
  async consumeSpin(todayLocal: string): Promise<RouletteRow> {
    return getDb().transaction('rw', getDb().roulette, async () => {
      const row = (await getDb().roulette.get(SINGLETON_KEY)) ?? DEFAULT_ROULETTE;
      let next: RouletteRow;
      if (row.lastFreeSpinDay !== todayLocal) {
        next = { ...row, lastFreeSpinDay: todayLocal };
      } else if (row.earnedSpins > 0) {
        next = { ...row, earnedSpins: row.earnedSpins - 1 };
      } else {
        throw new Error('No hay giros disponibles');
      }
      await getDb().roulette.put(next);
      return next;
    });
  },

  /** Grant one earned spin (from a ≥8/10 round). Capped at MAX_EARNED_SPINS. */
  async grantEarnedSpin(): Promise<RouletteRow> {
    return getDb().transaction('rw', getDb().roulette, async () => {
      const row = (await getDb().roulette.get(SINGLETON_KEY)) ?? DEFAULT_ROULETTE;
      const next = {
        ...row,
        earnedSpins: Math.min(MAX_EARNED_SPINS, row.earnedSpins + 1),
      };
      await getDb().roulette.put(next);
      return next;
    });
  },

  async setPendingX2(v: boolean): Promise<void> {
    const row = await rouletteRepo.get();
    await getDb().roulette.put({ ...row, pendingX2: v });
  },

  /** Persist the decided prize BEFORE animating (decide → persist → animate). */
  async setPendingPrize(segmentId: string | null): Promise<void> {
    const row = await rouletteRepo.get();
    await getDb().roulette.put({ ...row, pendingPrizeId: segmentId });
  },
};

/* ------------------------------------------------------------------ */
/* Availability check                                                  */
/* ------------------------------------------------------------------ */

/**
 * T4.6 — Detect whether IndexedDB is usable in the current environment.
 *
 * Returns false in: SSR build (no window), private browsing in some browsers,
 * very old browsers, or when the browser denies storage. The UI bootstrap
 * checks this and renders a blocking error screen on false.
 */
export async function isDbAvailable(): Promise<boolean> {
  if (typeof globalThis === 'undefined') return false;
  const g = globalThis as { indexedDB?: unknown };
  if (typeof g.indexedDB === 'undefined') return false;
  try {
    // Try to actually open the DB — Dexie throws on Safari private mode etc.
    await getDb().open();
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Achievements repo (v4 — T05)                                        */
/* ------------------------------------------------------------------ */

export const achievementsRepo = {
  async getAll(): Promise<AchievementRow[]> {
    return getDb().achievements.toArray();
  },

  async getUnlockedIds(): Promise<AchievementId[]> {
    const rows = await getDb().achievements.toArray();
    return rows.map((r) => r.achievementId);
  },

  async isUnlocked(id: AchievementId): Promise<boolean> {
    const row = await getDb().achievements.get(id);
    return row !== undefined;
  },

  /** Unlock one or more achievements. Idempotent — already-unlocked are skipped. */
  async unlock(ids: readonly AchievementId[], now: number): Promise<AchievementRow[]> {
    const newRows: AchievementRow[] = [];
    await getDb().transaction('rw', getDb().achievements, async () => {
      for (const id of ids) {
        const existing = await getDb().achievements.get(id);
        if (!existing) {
          const row: AchievementRow = { achievementId: id, unlockedAt: now };
          await getDb().achievements.put(row);
          newRows.push(row);
        }
      }
    });
    return newRows;
  },
};
