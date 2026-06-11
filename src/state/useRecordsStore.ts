/**
 * useRecordsStore — reactive cache of game records and global accuracy.
 *
 * Persists via recordsRepo. Exposes actions for updating records at
 * the end of each game round.
 */

'use client';

import { create } from 'zustand';
import type { ModuleId, GameMode } from '@/content/types';
import type { GameRecordRow, GlobalsRecordRow } from '@/infra/db/schema';
import { recordsRepo } from '@/infra/db/repos';
import {
  updateRecordAfterRound,
  accuracyPercent,
  type GameRecord,
  type GlobalsRecord,
} from '@/domain/records/records';

type RecordsState = {
  /** Keyed by `${moduleId}.${gameMode}`. */
  byKey: Record<string, GameRecordRow>;
  globals: GlobalsRecordRow;
  loaded: boolean;
};

type RecordsActions = {
  loadFromDb: () => Promise<void>;
  /**
   * Update records at the end of a round.
   * Returns { improved } = true if bestScore or bestRung increased.
   */
  updateAfterRound: (params: {
    moduleId: ModuleId;
    gameMode: GameMode;
    roundScore: number;
    maxRung: number;
    roundAnswered: number;
    roundCorrect: number;
  }) => Promise<{ improved: boolean }>;
  accuracyPercent: () => number;
  reset: () => void;
};

const INITIAL: RecordsState = {
  byKey: {},
  globals: { id: 'singleton', totalAnswered: 0, totalCorrect: 0 },
  loaded: false,
};

export const useRecordsStore = create<RecordsState & RecordsActions>(
  (set, get) => ({
    ...INITIAL,

    async loadFromDb() {
      const [rows, globals] = await Promise.all([
        recordsRepo.getAllRecords(),
        recordsRepo.getGlobals(),
      ]);
      const byKey: Record<string, GameRecordRow> = {};
      for (const r of rows) byKey[r.key] = r;
      set({ byKey, globals, loaded: true });
    },

    async updateAfterRound({ moduleId, gameMode, roundScore, maxRung, roundAnswered, roundCorrect }) {
      const key = `${moduleId}.${gameMode}`;
      const prev = get().byKey[key] ?? null;

      const newRecord = updateRecordAfterRound(
        prev as GameRecord | null,
        roundScore,
        maxRung,
        moduleId,
        gameMode,
      );

      const prevGlobals = get().globals;
      const newGlobals: GlobalsRecordRow = {
        id: 'singleton',
        totalAnswered: prevGlobals.totalAnswered + roundAnswered,
        totalCorrect: prevGlobals.totalCorrect + roundCorrect,
      };

      await Promise.all([
        recordsRepo.putRecord(newRecord as GameRecordRow),
        recordsRepo.putGlobals(newGlobals),
      ]);

      const improved =
        prev !== null &&
        (newRecord.bestScore > prev.bestScore || newRecord.bestRung > prev.bestRung);

      set((s) => ({
        byKey: { ...s.byKey, [key]: newRecord as GameRecordRow },
        globals: newGlobals,
      }));

      return { improved };
    },

    accuracyPercent() {
      return accuracyPercent(get().globals as GlobalsRecord);
    },

    reset: () => set(INITIAL),
  }),
);
