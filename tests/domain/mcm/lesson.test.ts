import { describe, it, expect } from 'vitest';
import {
  gcd,
  lcm,
  multiplesUpTo,
  classifyTap,
  MCM_LESSON,
} from '@/domain/mcm/lesson';

describe('gcd / lcm', () => {
  it.each([
    [2, 3, 1, 6],
    [4, 6, 2, 12],
    [6, 9, 3, 18],
    [8, 12, 4, 24],
    [2, 4, 2, 4], // one divides the other
    [4, 5, 1, 20], // coprime
  ])('gcd(%i,%i)=%i, lcm=%i', (a, b, g, l) => {
    expect(gcd(a, b)).toBe(g);
    expect(lcm(a, b)).toBe(l);
  });
});

describe('multiplesUpTo', () => {
  it('lists multiples up to and including max', () => {
    expect(multiplesUpTo(2, 6)).toEqual([2, 4, 6]);
    expect(multiplesUpTo(3, 6)).toEqual([3, 6]);
  });

  it('respects the chip cap', () => {
    expect(multiplesUpTo(1, 1000, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('MCM_LESSON curriculum', () => {
  it('every step has the correct LCM and tracks that contain it', () => {
    for (const step of MCM_LESSON) {
      expect(step.lcm).toBe(lcm(step.a, step.b));
      // the answer must actually appear in both visual tracks
      expect(step.multiplesA).toContain(step.lcm);
      expect(step.multiplesB).toContain(step.lcm);
    }
  });

  it('difficulty ramps: show → reveal → type, no regressions', () => {
    const order = { show: 0, reveal: 1, type: 2 } as const;
    const ranks = MCM_LESSON.map((s) => order[s.scaffold]);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]!);
    }
  });
});

describe('classifyTap', () => {
  const step = MCM_LESSON.find((s) => s.a === 2 && s.b === 3)!; // lcm 6

  it('identifies the correct answer', () => {
    expect(classifyTap(6, step)).toBe('correct');
  });

  it('flags a common multiple that is not the smallest', () => {
    expect(classifyTap(12, step)).toBe('common-not-smallest');
  });

  it('flags a multiple that lives in only one list', () => {
    expect(classifyTap(4, step)).toBe('only-a'); // 4 ∈ 2s, ∉ 3s
    expect(classifyTap(9, step)).toBe('only-b'); // 9 ∈ 3s, ∉ 2s
  });
});
