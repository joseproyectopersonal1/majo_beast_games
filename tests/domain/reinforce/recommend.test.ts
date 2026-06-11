/**
 * Tests for domain/reinforce/recommend.ts (T04).
 */

import { describe, it, expect } from 'vitest';
import { recommendedModule } from '@/domain/reinforce/recommend';
import { MODULE_IDS, type ModuleId } from '@/content/types';
import type { ModuleMastery } from '@/domain/progress/mastery';

function blankMastery(): Record<ModuleId, ModuleMastery> {
  const out = {} as Record<ModuleId, ModuleMastery>;
  for (const id of MODULE_IDS) {
    out[id] = { masteredCount: 0, inProgressCount: 0, weakCount: 0, masteryPercent: 0 };
  }
  return out;
}

describe('recommendedModule', () => {
  it('picks the module with the highest fragile proportion', () => {
    const m = blankMastery();
    m['tablas'] = { masteredCount: 8, inProgressCount: 1, weakCount: 1, masteryPercent: 80 }; // 10% frágil
    m['divisiones'] = { masteredCount: 2, inProgressCount: 2, weakCount: 4, masteryPercent: 25 }; // 50% frágil
    expect(recommendedModule(m)).toBe('divisiones');
  });

  it('falls back to lowest masteryPercent when nothing is fragile', () => {
    const m = blankMastery();
    // Every module has progress (no fragile items anywhere); mcm-mcd is weakest.
    m['tablas'] = { masteredCount: 9, inProgressCount: 1, weakCount: 0, masteryPercent: 90 };
    m['divisiones'] = { masteredCount: 8, inProgressCount: 2, weakCount: 0, masteryPercent: 80 };
    m['varias-cifras'] = { masteredCount: 7, inProgressCount: 3, weakCount: 0, masteryPercent: 70 };
    m['analiticos'] = { masteredCount: 6, inProgressCount: 4, weakCount: 0, masteryPercent: 60 };
    m['mcm-mcd'] = { masteredCount: 1, inProgressCount: 9, weakCount: 0, masteryPercent: 10 };
    expect(recommendedModule(m)).toBe('mcm-mcd');
  });

  it('returns the first module for a completely blank state', () => {
    expect(recommendedModule(blankMastery())).toBe(MODULE_IDS[0]);
  });

  it('ignores modules with zero items when computing fragile ratio', () => {
    const m = blankMastery();
    m['analiticos'] = { masteredCount: 0, inProgressCount: 1, weakCount: 1, masteryPercent: 0 }; // 50%
    expect(recommendedModule(m)).toBe('analiticos');
  });

  it('keeps the first-seen module on fragile-ratio ties', () => {
    const m = blankMastery();
    m['tablas'] = { masteredCount: 1, inProgressCount: 0, weakCount: 1, masteryPercent: 50 }; // 50%
    m['divisiones'] = { masteredCount: 1, inProgressCount: 0, weakCount: 1, masteryPercent: 50 }; // 50%
    expect(recommendedModule(m)).toBe('tablas'); // first in MODULE_IDS order
  });
});
