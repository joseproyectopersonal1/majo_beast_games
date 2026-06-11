/**
 * Tests for domain/reinforce/selection.ts
 */

import { describe, it, expect } from 'vitest';
import {
  isWeak,
  isMastered,
  weakItemsOf,
  sortForReinforce,
  WEAK_MIN_WRONG,
  WEAK_MAX_BOX,
  MASTERED_MIN_BOX,
  MASTERED_MIN_CONSECUTIVE,
} from '@/domain/reinforce/selection';
import { initialState, applyAnswer } from '@/domain/leitner/engine';
import type { LeitnerState } from '@/domain/leitner/types';

function makeState(overrides: Partial<LeitnerState>): LeitnerState {
  return { ...initialState('test.item'), ...overrides };
}

describe('isWeak', () => {
  it('returns true when totalWrong >= 2 and box <= 1', () => {
    const s = makeState({ totalWrong: 2, box: 1 });
    expect(isWeak(s)).toBe(true);
  });

  it('returns false when totalWrong < 2', () => {
    const s = makeState({ totalWrong: 1, box: 1 });
    expect(isWeak(s)).toBe(false);
  });

  it('returns false when box > 1', () => {
    const s = makeState({ totalWrong: 5, box: 2 });
    expect(isWeak(s)).toBe(false);
  });

  it('WEAK_MIN_WRONG and WEAK_MAX_BOX constants match the definition', () => {
    expect(WEAK_MIN_WRONG).toBe(2);
    expect(WEAK_MAX_BOX).toBe(1);
  });
});

describe('isMastered', () => {
  it('returns true when box >= 3 and consecutiveCorrect >= 3', () => {
    const s = makeState({ box: 3, consecutiveCorrect: 3 });
    expect(isMastered(s)).toBe(true);
  });

  it('returns false when box < 3', () => {
    const s = makeState({ box: 2, consecutiveCorrect: 5 });
    expect(isMastered(s)).toBe(false);
  });

  it('returns false when consecutiveCorrect < 3', () => {
    const s = makeState({ box: 4, consecutiveCorrect: 2 });
    expect(isMastered(s)).toBe(false);
  });

  it('MASTERED constants match the definition', () => {
    expect(MASTERED_MIN_BOX).toBe(3);
    expect(MASTERED_MIN_CONSECUTIVE).toBe(3);
  });
});

describe('weakItemsOf', () => {
  it('returns only fragile items from the given module', () => {
    const states: LeitnerState[] = [
      makeState({ itemId: 'tablas.mult.2x3', totalWrong: 3, box: 0 }), // weak
      makeState({ itemId: 'tablas.mult.3x4', totalWrong: 1, box: 0 }), // not weak (totalWrong < 2)
      makeState({ itemId: 'tablas.mult.4x5', totalWrong: 2, box: 2 }), // not weak (box > 1)
      makeState({ itemId: 'divisiones.div.6_2', totalWrong: 5, box: 0 }), // different module
    ];
    const ids = weakItemsOf(states, 'tablas');
    expect(ids).toEqual(['tablas.mult.2x3']);
  });

  it('returns empty array if no fragile items in module', () => {
    const states: LeitnerState[] = [
      makeState({ itemId: 'tablas.mult.2x3', totalWrong: 0, box: 3 }),
    ];
    expect(weakItemsOf(states, 'tablas')).toEqual([]);
  });

  it('does not include items from other modules', () => {
    const states: LeitnerState[] = [
      makeState({ itemId: 'divisiones.div.8_4', totalWrong: 3, box: 0 }),
    ];
    expect(weakItemsOf(states, 'tablas')).toHaveLength(0);
  });
});

describe('sortForReinforce', () => {
  it('sorts by totalWrong descending first', () => {
    const a = makeState({ itemId: 'a', totalWrong: 2, box: 1 });
    const b = makeState({ itemId: 'b', totalWrong: 5, box: 1 });
    const c = makeState({ itemId: 'c', totalWrong: 3, box: 0 });
    const sorted = sortForReinforce([a, b, c]);
    expect(sorted[0]!.itemId).toBe('b');
    expect(sorted[1]!.itemId).toBe('c');
    expect(sorted[2]!.itemId).toBe('a');
  });

  it('sorts by box ascending as tiebreaker', () => {
    const a = makeState({ itemId: 'a', totalWrong: 3, box: 1 });
    const b = makeState({ itemId: 'b', totalWrong: 3, box: 0 });
    const sorted = sortForReinforce([a, b]);
    expect(sorted[0]!.itemId).toBe('b'); // box 0 first
    expect(sorted[1]!.itemId).toBe('a'); // box 1 second
  });

  it('does not mutate the input array', () => {
    const states = [
      makeState({ itemId: 'a', totalWrong: 1 }),
      makeState({ itemId: 'b', totalWrong: 5 }),
    ];
    const original = [...states];
    sortForReinforce(states);
    expect(states[0]!.itemId).toBe(original[0]!.itemId);
  });
});

describe('fragile → mastered transition detection', () => {
  it('a weak item can reach mastered via consecutive correct answers', () => {
    let state = makeState({ itemId: 'tablas.mult.5x6', totalWrong: 2, box: 1, consecutiveCorrect: 0 });
    expect(isWeak(state)).toBe(true);
    expect(isMastered(state)).toBe(false);

    // Apply correct answers until mastered.
    const now = Date.now();
    state = applyAnswer(state, true, now);     // box 2, consecutive 1
    state = applyAnswer(state, true, now + 1); // box 3, consecutive 2
    state = applyAnswer(state, true, now + 2); // box 4, consecutive 3

    expect(isMastered(state)).toBe(true);
  });
});
