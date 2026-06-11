/**
 * Tests for domain/records/records.ts
 */

import { describe, it, expect } from 'vitest';
import {
  updateRecordAfterRound,
  accuracyPercent,
  type GameRecord,
  type GlobalsRecord,
} from '@/domain/records/records';

describe('updateRecordAfterRound', () => {
  it('creates a new record on first play (prev = null)', () => {
    const rec = updateRecordAfterRound(null, 1500, 7, 'tablas', 'reto-reloj');
    expect(rec.key).toBe('tablas.reto-reloj');
    expect(rec.moduleId).toBe('tablas');
    expect(rec.gameMode).toBe('reto-reloj');
    expect(rec.bestScore).toBe(1500);
    expect(rec.bestRung).toBe(7);
    expect(rec.playedCount).toBe(1);
  });

  it('updates bestScore when new score is higher', () => {
    const prev: GameRecord = {
      key: 'tablas.reto-reloj',
      moduleId: 'tablas',
      gameMode: 'reto-reloj',
      bestScore: 1000,
      bestRung: 5,
      playedCount: 3,
    };
    const next = updateRecordAfterRound(prev, 2000, 5, 'tablas', 'reto-reloj');
    expect(next.bestScore).toBe(2000);
    expect(next.playedCount).toBe(4);
  });

  it('does not lower bestScore when new score is lower', () => {
    const prev: GameRecord = {
      key: 'tablas.reto-reloj',
      moduleId: 'tablas',
      gameMode: 'reto-reloj',
      bestScore: 3000,
      bestRung: 9,
      playedCount: 5,
    };
    const next = updateRecordAfterRound(prev, 500, 3, 'tablas', 'reto-reloj');
    expect(next.bestScore).toBe(3000);
    expect(next.bestRung).toBe(9);
    expect(next.playedCount).toBe(6);
  });

  it('updates bestRung when new rung is higher', () => {
    const prev: GameRecord = {
      key: 'tablas.reto-reloj',
      moduleId: 'tablas',
      gameMode: 'reto-reloj',
      bestScore: 1000,
      bestRung: 4,
      playedCount: 1,
    };
    const next = updateRecordAfterRound(prev, 900, 6, 'tablas', 'reto-reloj');
    expect(next.bestRung).toBe(6);
  });

  it('increments playedCount on every round', () => {
    let rec = updateRecordAfterRound(null, 100, 1, 'tablas', 'reto-reloj');
    rec = updateRecordAfterRound(rec, 200, 2, 'tablas', 'reto-reloj');
    rec = updateRecordAfterRound(rec, 150, 1, 'tablas', 'reto-reloj');
    expect(rec.playedCount).toBe(3);
  });
});

describe('accuracyPercent', () => {
  it('returns 0 when no answers recorded', () => {
    const g: GlobalsRecord = { id: 'singleton', totalAnswered: 0, totalCorrect: 0 };
    expect(accuracyPercent(g)).toBe(0);
  });

  it('returns 100 for all correct', () => {
    const g: GlobalsRecord = { id: 'singleton', totalAnswered: 10, totalCorrect: 10 };
    expect(accuracyPercent(g)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    const g: GlobalsRecord = { id: 'singleton', totalAnswered: 3, totalCorrect: 2 };
    // 2/3 * 100 = 66.67 → rounds to 67
    expect(accuracyPercent(g)).toBe(67);
  });

  it('returns 0 for 0 correct out of N', () => {
    const g: GlobalsRecord = { id: 'singleton', totalAnswered: 5, totalCorrect: 0 };
    expect(accuracyPercent(g)).toBe(0);
  });
});
