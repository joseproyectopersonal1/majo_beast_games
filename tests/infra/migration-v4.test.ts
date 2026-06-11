/**
 * Migration test v3 → v4 (T05 §F27): the achievements table is additive and
 * all earlier data (incl. v3 roulette) survives the upgrade.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {
  BeastGamesDB,
  _resetDbForTests,
  SINGLETON_KEY,
  DEFAULT_PRIZE_LEDGER,
} from '@/infra/db/schema';
import { achievementsRepo, prizeRepo, rouletteRepo } from '@/infra/db/repos';
import { initialState } from '@/domain/leitner/engine';

const DB_NAME = 'beast-games';

beforeEach(async () => {
  try {
    const tmp = new Dexie(DB_NAME);
    await tmp.delete();
  } catch {
    /* ignore */
  }
  _resetDbForTests();
});

describe('schema migration v3 → v4', () => {
  it('preserves v1–v3 data and exposes the empty achievements table', async () => {
    // Build a DB with the v1+v2+v3 schema only and populate it.
    const v3 = new Dexie(DB_NAME);
    v3.version(1).stores({
      settings: 'id',
      leitnerStates: 'itemId, box, lastSeenAt',
      prizeLedger: 'id',
      sessionLog: '++id, startedAt',
    });
    v3.version(2).stores({
      inventory: 'powerupId',
      streaks: 'id',
      records: 'key',
      globalsRecord: 'id',
    });
    v3.version(3).stores({ roulette: 'id' });
    await v3.open();
    await v3.table('prizeLedger').put({ ...DEFAULT_PRIZE_LEDGER, coins: 4242 });
    await v3.table('leitnerStates').put(initialState('tablas.mult.9x9'));
    await v3.table('roulette').put({
      id: SINGLETON_KEY,
      lastFreeSpinDay: '2026-06-12',
      earnedSpins: 2,
      pendingX2: true,
      pendingPrizeId: null,
    });
    await v3.close();

    // Open with the full v4 schema.
    _resetDbForTests();
    const db = new BeastGamesDB();
    await db.open();

    expect((await db.prizeLedger.get(SINGLETON_KEY))?.coins).toBe(4242);
    expect(await db.leitnerStates.count()).toBe(1);
    const roul = await db.roulette.get(SINGLETON_KEY);
    expect(roul?.earnedSpins).toBe(2);
    expect(roul?.pendingX2).toBe(true);
    // New v4 table accessible and empty.
    expect(await db.achievements.count()).toBe(0);
    await db.close();

    // Repos work over the migrated DB.
    _resetDbForTests();
    expect((await prizeRepo.get()).coins).toBe(4242);
    expect(await rouletteRepo.availableSpins('2026-06-12')).toBe(2); // daily used that day → only earned
    expect(await achievementsRepo.getAll()).toHaveLength(0);
  });

  it('achievementsRepo.unlock is idempotent', async () => {
    _resetDbForTests();
    const now = 1_000;
    await achievementsRepo.unlock(['primer-acierto', 'racha-5'], now);
    await achievementsRepo.unlock(['primer-acierto', 'racha-10'], now + 1);
    const all = await achievementsRepo.getAll();
    const ids = all.map((r) => r.achievementId).sort();
    expect(ids).toEqual(['primer-acierto', 'racha-10', 'racha-5']);
    // The first unlock timestamp for primer-acierto is preserved.
    expect(all.find((r) => r.achievementId === 'primer-acierto')?.unlockedAt).toBe(now);
  });
});
