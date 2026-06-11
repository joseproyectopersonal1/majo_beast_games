/**
 * Tests for domain/achievements/check.ts (T05 §F27).
 *
 * Exercises every achievement condition plus the already-unlocked filter.
 */

import { describe, it, expect } from 'vitest';
import { checkAchievements, type AchievementSnapshot } from '@/domain/achievements/check';
import { MODULE_IDS, type ModuleId } from '@/content/types';

type Mastery = AchievementSnapshot['moduleMastery'][ModuleId];

function blankMastery(): AchievementSnapshot['moduleMastery'] {
  const out = {} as AchievementSnapshot['moduleMastery'];
  for (const id of MODULE_IDS) {
    out[id] = { masteredCount: 0, inProgressCount: 0, weakCount: 0, masteryPercent: 0 };
  }
  return out;
}

function baseSnapshot(over: Partial<AchievementSnapshot> = {}): AchievementSnapshot {
  return {
    unlockedIds: [],
    totalCorrect: 0,
    bestAnswerStreak: 0,
    currentDayStreak: 0,
    bestDayStreak: 0,
    coins: 0,
    hasPurchased: false,
    totalInventory: 0,
    moduleMastery: blankMastery(),
    playedModules: new Set<ModuleId>(),
    hasSuperadoDebilidad: false,
    hasCompletedBoss: false,
    hasPerfectBoss: false,
    hasCompletedReto: false,
    hasWonBestial: false,
    ...over,
  };
}

describe('checkAchievements — individual conditions', () => {
  it('unlocks nothing for a blank snapshot', () => {
    expect(checkAchievements(baseSnapshot())).toEqual([]);
  });

  it('primer-acierto on first correct answer', () => {
    expect(checkAchievements(baseSnapshot({ totalCorrect: 1 }))).toContain('primer-acierto');
  });

  it('streak achievements unlock at their thresholds (cumulative)', () => {
    expect(checkAchievements(baseSnapshot({ bestAnswerStreak: 5 }))).toContain('racha-5');
    const at10 = checkAchievements(baseSnapshot({ bestAnswerStreak: 10 }));
    expect(at10).toEqual(expect.arrayContaining(['racha-5', 'racha-10']));
    const at20 = checkAchievements(baseSnapshot({ bestAnswerStreak: 20 }));
    expect(at20).toEqual(expect.arrayContaining(['racha-5', 'racha-10', 'racha-20']));
  });

  it('does not unlock racha-10 below threshold', () => {
    expect(checkAchievements(baseSnapshot({ bestAnswerStreak: 9 }))).not.toContain('racha-10');
  });

  it('jefe-derrotado and jefe-perfecto from boss flags', () => {
    expect(checkAchievements(baseSnapshot({ hasCompletedBoss: true }))).toContain('jefe-derrotado');
    expect(checkAchievements(baseSnapshot({ hasPerfectBoss: true }))).toContain('jefe-perfecto');
  });

  it('primer-modulo-dominado when any module hits 100%', () => {
    const m = blankMastery();
    m['tablas'] = { masteredCount: 10, inProgressCount: 0, weakCount: 0, masteryPercent: 100 };
    expect(checkAchievements(baseSnapshot({ moduleMastery: m }))).toContain('primer-modulo-dominado');
  });

  it('todos-modulos-jugados only when every module was played', () => {
    const partial = new Set<ModuleId>(MODULE_IDS.slice(0, MODULE_IDS.length - 1));
    expect(checkAchievements(baseSnapshot({ playedModules: partial }))).not.toContain('todos-modulos-jugados');
    const all = new Set<ModuleId>(MODULE_IDS);
    expect(checkAchievements(baseSnapshot({ playedModules: all }))).toContain('todos-modulos-jugados');
  });

  it('debilidad-superada from the flag', () => {
    expect(checkAchievements(baseSnapshot({ hasSuperadoDebilidad: true }))).toContain('debilidad-superada');
  });

  it('sin-debilidades needs ≥10 seen and 0 weak', () => {
    const few: AchievementSnapshot['moduleMastery'] = blankMastery();
    few['tablas'] = { masteredCount: 5, inProgressCount: 4, weakCount: 0, masteryPercent: 55 }; // total 9
    expect(checkAchievements(baseSnapshot({ moduleMastery: few }))).not.toContain('sin-debilidades');

    const enough: AchievementSnapshot['moduleMastery'] = blankMastery();
    enough['tablas'] = { masteredCount: 6, inProgressCount: 4, weakCount: 0, masteryPercent: 60 }; // total 10
    expect(checkAchievements(baseSnapshot({ moduleMastery: enough }))).toContain('sin-debilidades');

    const withWeak: AchievementSnapshot['moduleMastery'] = blankMastery();
    withWeak['tablas'] = { masteredCount: 6, inProgressCount: 3, weakCount: 2, masteryPercent: 54 }; // total 11, weak 2
    expect(checkAchievements(baseSnapshot({ moduleMastery: withWeak }))).not.toContain('sin-debilidades');
  });

  it('day streak achievements', () => {
    expect(checkAchievements(baseSnapshot({ bestDayStreak: 7 }))).toContain('dias-7');
    expect(checkAchievements(baseSnapshot({ bestDayStreak: 30 }))).toEqual(
      expect.arrayContaining(['dias-7', 'dias-30']),
    );
  });

  it('tienda achievements', () => {
    expect(checkAchievements(baseSnapshot({ hasPurchased: true }))).toContain('primera-compra');
    expect(checkAchievements(baseSnapshot({ totalInventory: 5 }))).toContain('coleccionista');
    expect(checkAchievements(baseSnapshot({ totalInventory: 4 }))).not.toContain('coleccionista');
    expect(checkAchievements(baseSnapshot({ coins: 1000 }))).toContain('monedas-1000');
    expect(checkAchievements(baseSnapshot({ coins: 10000 }))).toEqual(
      expect.arrayContaining(['monedas-1000', 'monedas-10000']),
    );
  });

  it('ruleta achievements', () => {
    expect(checkAchievements(baseSnapshot({ hasCompletedReto: true }))).toContain('primer-reto');
    expect(checkAchievements(baseSnapshot({ hasWonBestial: true }))).toContain('giro-bestial');
  });
});

describe('checkAchievements — already-unlocked filter', () => {
  it('does not re-report already-unlocked achievements', () => {
    const snap = baseSnapshot({
      totalCorrect: 1,
      bestAnswerStreak: 5,
      unlockedIds: ['primer-acierto'],
    });
    const result = checkAchievements(snap);
    expect(result).not.toContain('primer-acierto');
    expect(result).toContain('racha-5');
  });

  it('returns empty when everything qualifying is already unlocked', () => {
    const snap = baseSnapshot({
      totalCorrect: 1,
      unlockedIds: ['primer-acierto'],
    });
    expect(checkAchievements(snap)).toEqual([]);
  });
});
