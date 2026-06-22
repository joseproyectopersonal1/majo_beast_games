import { describe, it, expect } from 'vitest';
import {
  gcd,
  divisorsOf,
  commonDivisors,
  decompose,
  patternTerms,
  patAnswer,
  TABLAS_STEPS,
  mulAnswer,
  DIVISIONES_STEPS,
  divAnswer,
  VARIAS_STEPS,
  mdAnswer,
  ANALITICOS_STEPS,
  MCD_STEPS,
  mcdAnswer,
} from '@/domain/learn/lessons';

describe('number helpers', () => {
  it('divisorsOf', () => {
    expect(divisorsOf(12)).toEqual([1, 2, 3, 4, 6, 12]);
    expect(divisorsOf(7)).toEqual([1, 7]);
  });
  it('commonDivisors / gcd agree', () => {
    const cd = commonDivisors(12, 18);
    expect(cd).toEqual([1, 2, 3, 6]);
    expect(Math.max(...cd)).toBe(gcd(12, 18));
  });
  it('decompose splits by place value and sums back', () => {
    const d = decompose(13, 4);
    expect(d).toMatchObject({ tens: 10, units: 3, partialTens: 40, partialUnits: 12, total: 52 });
    expect(d.partialTens + d.partialUnits).toBe(d.total);
  });
  it('pattern terms + next', () => {
    const s = { start: 2, diff: 2, terms: 4, scaffold: 'show' as const };
    expect(patternTerms(s)).toEqual([2, 4, 6, 8]);
    expect(patAnswer(s)).toBe(10);
  });
});

describe('curricula are internally consistent', () => {
  it('tablas options always contain the answer', () => {
    for (const s of TABLAS_STEPS) {
      if (s.options) expect(s.options).toContain(mulAnswer(s));
    }
  });
  it('divisiones divide evenly and options contain the answer', () => {
    for (const s of DIVISIONES_STEPS) {
      expect(s.total % s.groups).toBe(0);
      if (s.options) expect(s.options).toContain(divAnswer(s));
    }
  });
  it('varias-cifras options contain the answer', () => {
    for (const s of VARIAS_STEPS) {
      if (s.options) expect(s.options).toContain(mdAnswer(s));
    }
  });
  it('analiticos options contain the next term', () => {
    for (const s of ANALITICOS_STEPS) {
      if (s.options) expect(s.options).toContain(patAnswer(s));
    }
  });
  it('mcd answers match gcd', () => {
    for (const s of MCD_STEPS) {
      expect(mcdAnswer(s)).toBe(gcd(s.a, s.b));
    }
  });

  it('every curriculum ramps show → reveal → type without regression', () => {
    const rank = { show: 0, reveal: 1, type: 2 } as const;
    for (const steps of [TABLAS_STEPS, DIVISIONES_STEPS, VARIAS_STEPS, ANALITICOS_STEPS, MCD_STEPS]) {
      const ranks = steps.map((s) => rank[s.scaffold]);
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]!);
      }
    }
  });
});
