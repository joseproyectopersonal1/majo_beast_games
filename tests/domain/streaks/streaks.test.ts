/**
 * Tests for domain/streaks/streaks.ts
 */

import { describe, it, expect } from 'vitest';
import {
  applyAnswerToStreaks,
  applyDayPlayed,
  type StreaksState,
} from '@/domain/streaks/streaks';

function makeState(overrides: Partial<StreaksState> = {}): StreaksState {
  return {
    id: 'singleton',
    currentAnswerStreak: 0,
    bestAnswerStreak: 0,
    bestAnswerStreakByModule: {},
    lastPlayedDay: '',
    currentDayStreak: 0,
    bestDayStreak: 0,
    ...overrides,
  };
}

describe('applyAnswerToStreaks', () => {
  it('increments streak on correct answer', () => {
    const s = makeState({ currentAnswerStreak: 3, bestAnswerStreak: 3 });
    const next = applyAnswerToStreaks(s, true, 'tablas');
    expect(next.currentAnswerStreak).toBe(4);
    expect(next.bestAnswerStreak).toBe(4);
  });

  it('resets streak on wrong answer', () => {
    const s = makeState({ currentAnswerStreak: 5, bestAnswerStreak: 5 });
    const next = applyAnswerToStreaks(s, false, 'tablas');
    expect(next.currentAnswerStreak).toBe(0);
    expect(next.bestAnswerStreak).toBe(5); // best preserved
  });

  it('does not lower bestAnswerStreak on reset', () => {
    const s = makeState({ currentAnswerStreak: 2, bestAnswerStreak: 10 });
    const next = applyAnswerToStreaks(s, false, 'tablas');
    expect(next.bestAnswerStreak).toBe(10);
  });

  it('updates per-module best', () => {
    const s = makeState({ currentAnswerStreak: 4 });
    const next = applyAnswerToStreaks(s, true, 'divisiones');
    expect(next.bestAnswerStreakByModule['divisiones']).toBe(5);
  });

  it('does not decrease per-module best', () => {
    const s = makeState({
      currentAnswerStreak: 1,
      bestAnswerStreakByModule: { tablas: 8 },
    });
    const next = applyAnswerToStreaks(s, true, 'tablas');
    expect(next.bestAnswerStreakByModule['tablas']).toBe(8);
  });

  it('wrong answer does not reset per-module bests', () => {
    const s = makeState({
      currentAnswerStreak: 3,
      bestAnswerStreakByModule: { tablas: 7 },
    });
    const next = applyAnswerToStreaks(s, false, 'tablas');
    expect(next.bestAnswerStreakByModule['tablas']).toBe(7);
  });

  it('does not touch day streak fields', () => {
    const s = makeState({ lastPlayedDay: '2025-01-01', currentDayStreak: 5, bestDayStreak: 5 });
    const next = applyAnswerToStreaks(s, true, 'tablas');
    expect(next.lastPlayedDay).toBe('2025-01-01');
    expect(next.currentDayStreak).toBe(5);
  });
});

describe('applyDayPlayed', () => {
  it('first play: sets streak to 1', () => {
    const s = makeState({ lastPlayedDay: '' });
    const next = applyDayPlayed(s, '2025-06-01');
    expect(next.currentDayStreak).toBe(1);
    expect(next.bestDayStreak).toBe(1);
    expect(next.lastPlayedDay).toBe('2025-06-01');
  });

  it('same day: no change', () => {
    const s = makeState({ lastPlayedDay: '2025-06-01', currentDayStreak: 3, bestDayStreak: 5 });
    const next = applyDayPlayed(s, '2025-06-01');
    expect(next).toBe(s); // same reference
  });

  it('consecutive day: increments streak', () => {
    const s = makeState({ lastPlayedDay: '2025-06-01', currentDayStreak: 3, bestDayStreak: 5 });
    const next = applyDayPlayed(s, '2025-06-02');
    expect(next.currentDayStreak).toBe(4);
    expect(next.bestDayStreak).toBe(5); // 4 < 5, best unchanged
    expect(next.lastPlayedDay).toBe('2025-06-02');
  });

  it('consecutive day: updates best if exceeded', () => {
    const s = makeState({ lastPlayedDay: '2025-06-01', currentDayStreak: 5, bestDayStreak: 5 });
    const next = applyDayPlayed(s, '2025-06-02');
    expect(next.currentDayStreak).toBe(6);
    expect(next.bestDayStreak).toBe(6);
  });

  it('gap of 2 days: resets streak to 1', () => {
    const s = makeState({ lastPlayedDay: '2025-06-01', currentDayStreak: 10, bestDayStreak: 10 });
    const next = applyDayPlayed(s, '2025-06-03');
    expect(next.currentDayStreak).toBe(1);
    expect(next.bestDayStreak).toBe(10); // best preserved
  });

  it('month boundary: consecutive is handled correctly', () => {
    const s = makeState({ lastPlayedDay: '2025-01-31', currentDayStreak: 2 });
    const next = applyDayPlayed(s, '2025-02-01');
    expect(next.currentDayStreak).toBe(3);
  });

  it('does not touch answer streak fields', () => {
    const s = makeState({ currentAnswerStreak: 7, bestAnswerStreak: 7 });
    const next = applyDayPlayed(s, '2025-06-01');
    expect(next.currentAnswerStreak).toBe(7);
    expect(next.bestAnswerStreak).toBe(7);
  });
});
