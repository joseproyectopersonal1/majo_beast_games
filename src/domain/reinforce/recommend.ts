/**
 * Recommended module selection (T04 §A.3 fallback + §B.4 reto question).
 *
 * Rule: the module with the highest PROPORTION of fragile items;
 * if no module has fragile items, the one with the lowest masteryPercent.
 * Deterministic tiebreak: first in MODULE_IDS order.
 *
 * Pure function. No I/O.
 */

import type { ModuleId } from '@/content/types';
import type { ModuleMastery } from '@/domain/progress/mastery';
import { MODULE_IDS } from '@/content/types';

export function recommendedModule(
  mastery: Record<ModuleId, ModuleMastery>,
): ModuleId {
  let bestFragile: ModuleId | null = null;
  let bestFragileRatio = 0;

  for (const id of MODULE_IDS) {
    const m = mastery[id];
    if (!m) continue;
    const total = m.masteredCount + m.inProgressCount + m.weakCount;
    if (total === 0) continue;
    const ratio = m.weakCount / total;
    if (ratio > bestFragileRatio) {
      bestFragileRatio = ratio;
      bestFragile = id;
    }
  }
  if (bestFragile !== null) return bestFragile;

  // No fragile items anywhere: lowest masteryPercent wins.
  let lowest: ModuleId = MODULE_IDS[0];
  let lowestPercent = Infinity;
  for (const id of MODULE_IDS) {
    const percent = mastery[id]?.masteryPercent ?? 0;
    if (percent < lowestPercent) {
      lowestPercent = percent;
      lowest = id;
    }
  }
  return lowest;
}
