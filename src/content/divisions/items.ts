/**
 * Division facts — item bank for the `divisiones` module.
 *
 * Derived from the same 2×2..9×9 multiplication table. Each pair (a, b)
 * produces one division question: (a×b) ÷ a = b.
 *
 * This gives 64 items. Combined with the 64 tablas items every multiplication
 * fact is practised both ways, reinforcing number sense without duplication.
 *
 * Item ID convention:
 *   divisiones.div.{dividend}by{divisor}
 *   e.g. "divisiones.div.42by6"  →  42 ÷ 6 = 7
 *
 * Difficulty mirrors the tablas heuristic (based on the divisor factor):
 *   1 — divisor ≤ 5
 *   2 — divisor in 6..7
 *   3 — divisor ≥ 8
 */

import type { Item } from '@/content/types';

function difficulty(divisorFactor: number): 1 | 2 | 3 {
  if (divisorFactor <= 5) return 1;
  if (divisorFactor <= 7) return 2;
  return 3;
}

function feedbackId(d: 1 | 2 | 3): string {
  if (d === 1) return 'divisiones.easy';
  if (d === 2) return 'divisiones.medium';
  return 'divisiones.hard';
}

export const DIVISIONS_ITEMS: readonly Item[] = (() => {
  const items: Item[] = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      // Question: (a×b) ÷ a = b  →  prompt shows dividend=(a*b), divisor=a
      const dividend = a * b;
      const divisor = a;
      const quotient = b;
      const d = difficulty(divisor);
      items.push({
        id: `divisiones.div.${dividend}by${divisor}`,
        moduleId: 'divisiones',
        kind: 'div',
        prompt: { type: 'arithmetic', a: dividend, b: divisor, op: '÷' },
        answer: { type: 'numeric', value: quotient },
        difficulty: d,
        feedbackTemplateId: feedbackId(d),
      });
    }
  }
  return items;
})();
