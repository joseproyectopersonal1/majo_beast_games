/**
 * Migration test: verifies that upgrading from schema v1 to v2 preserves
 * all existing v1 data (leitnerStates, prizeLedger, settings, sessionLog).
 *
 * Strategy:
 *   1. Create a v1-only Dexie instance and populate it.
 *   2. Close and delete the singleton.
 *   3. Open with the full v2 schema (BeastGamesDB).
 *   4. Assert all v1 rows are still intact.
 *   5. Assert new v2 tables are accessible (empty, not erroring).
 */

import { beforeEach, describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {
  BeastGamesDB,
  _resetDbForTests,
  SINGLETON_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_PRIZE_LEDGER,
} from '@/infra/db/schema';
import { applyAnswer, initialState } from '@/domain/leitner/engine';

const DB_NAME = 'beast-games';

beforeEach(async () => {
  // Delete DB between tests to start clean.
  try {
    const tmp = new Dexie(DB_NAME);
    await tmp.delete();
  } catch {
    /* ignore */
  }
  _resetDbForTests();
});

describe('schema migration v1 → v2', () => {
  it('preserves leitnerStates, prizeLedger, settings, sessionLog after v2 upgrade', async () => {
    // ── Step 1: create a v1 schema and populate it ──────────────────
    const v1 = new Dexie(DB_NAME);
    v1.version(1).stores({
      settings: 'id',
      leitnerStates: 'itemId, box, lastSeenAt',
      prizeLedger: 'id',
      sessionLog: '++id, startedAt',
    });

    await v1.open();

    // Seed settings
    const settingsTable = v1.table<typeof DEFAULT_SETTINGS, typeof SINGLETON_KEY>('settings');
    await settingsTable.put({ ...DEFAULT_SETTINGS, audioEnabled: false, hasOnboarded: true });

    // Seed leitnerStates
    const leitnerTable = v1.table('leitnerStates');
    const stateA = applyAnswer(initialState('tablas.mult.3x4'), true, 1000);
    const stateB = applyAnswer(applyAnswer(initialState('divisiones.div.8_4'), true, 2000), false, 3000);
    await leitnerTable.bulkPut([stateA, stateB]);

    // Seed prizeLedger
    const ledgerTable = v1.table('prizeLedger');
    await ledgerTable.put({ ...DEFAULT_PRIZE_LEDGER, coins: 1500, trophies: 2 });

    // Seed sessionLog
    const sessionTable = v1.table('sessionLog');
    await sessionTable.add({
      startedAt: 5000,
      endedAt: 6000,
      itemsAnswered: 4,
      correct: 3,
      wrong: 1,
      coinsEarned: 400,
    });

    await v1.close();

    // ── Step 2: open with full v2 schema ───────────────────────────
    _resetDbForTests(); // Ensure a fresh BeastGamesDB instance is created.
    const db = new BeastGamesDB();
    await db.open();

    // ── Step 3: verify v1 data is intact ───────────────────────────
    const settings = await db.settings.get(SINGLETON_KEY);
    expect(settings?.audioEnabled).toBe(false);
    expect(settings?.hasOnboarded).toBe(true);

    const leitnerRows = await db.leitnerStates.toArray();
    expect(leitnerRows).toHaveLength(2);
    const a = leitnerRows.find((r) => r.itemId === 'tablas.mult.3x4');
    expect(a?.box).toBe(1); // One correct answer → box 1.

    const ledger = await db.prizeLedger.get(SINGLETON_KEY);
    expect(ledger?.coins).toBe(1500);
    expect(ledger?.trophies).toBe(2);

    const sessions = await db.sessionLog.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.correct).toBe(3);

    // ── Step 4: verify v2 tables are accessible (empty) ─────────────
    const inventory = await db.inventory.toArray();
    expect(inventory).toHaveLength(0);

    const streaks = await db.streaks.toArray();
    expect(streaks).toHaveLength(0);

    const records = await db.records.toArray();
    expect(records).toHaveLength(0);

    await db.close();
  });
});
