/**
 * Multiplication tables — item bank for the `tablas` module.
 *
 * Generates all 64 facts from 2×2 through 9×9.
 *
 * Item ID convention (also relied on by domain/progress/mastery.ts):
 *   tablas.mult.AxB   (A = first factor, B = second factor, both in 2..9)
 *
 * Difficulty heuristic:
 *   1 — both factors ≤ 5   (easier recall, smaller products)
 *   2 — at least one factor in 6..7
 *   3 — both factors ≥ 6   (hardest — 6×8, 7×9, 8×9, etc.)
 *
 * Feedback template groups:
 *   tablas.easy   → difficulty 1
 *   tablas.medium → difficulty 2
 *   tablas.hard   → difficulty 3
 */

import type { Item } from '@/content/types';

function difficulty(a: number, b: number): 1 | 2 | 3 {
  const hi = Math.max(a, b);
  if (hi <= 5) return 1;
  const lo = Math.min(a, b);
  if (lo >= 6) return 3;
  return 2;
}

function feedbackId(d: 1 | 2 | 3): string {
  if (d === 1) return 'tablas.easy';
  if (d === 2) return 'tablas.medium';
  return 'tablas.hard';
}

export const TABLES_ITEMS: readonly Item[] = (() => {
  const items: Item[] = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      const d = difficulty(a, b);
      items.push({
        id: `tablas.mult.${a}x${b}`,
        moduleId: 'tablas',
        kind: 'mult',
        prompt: { type: 'arithmetic', a, b, op: '×' },
        answer: { type: 'numeric', value: a * b },
        difficulty: d,
        feedbackTemplateId: feedbackId(d),
      });
    }
  }
  return items;
})();
