/**
 * Tests for domain/achievements/catalog.ts (T05 §F27).
 */

import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  achievementById,
  type AchievementId,
} from '@/domain/achievements/catalog';

describe('ACHIEVEMENTS catalog', () => {
  it('has exactly 18 achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(18);
  });

  it('has unique ids', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(18);
  });

  it('ACHIEVEMENT_IDS mirrors the catalog order', () => {
    expect(ACHIEVEMENT_IDS).toEqual(ACHIEVEMENTS.map((a) => a.id));
  });

  it('every achievement has name, emoji, description and a valid category', () => {
    const categories = new Set(['juego', 'progreso', 'tienda', 'ruleta']);
    for (const a of ACHIEVEMENTS) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.emoji.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(categories.has(a.category)).toBe(true);
    }
  });

  it('covers all four categories', () => {
    const present = new Set(ACHIEVEMENTS.map((a) => a.category));
    expect(present).toEqual(new Set(['juego', 'progreso', 'tienda', 'ruleta']));
  });

  it('achievementById returns the achievement', () => {
    expect(achievementById('giro-bestial').emoji).toBe('🏆');
    expect(achievementById('jefe-perfecto').category).toBe('juego');
  });

  it('achievementById throws on unknown id', () => {
    expect(() => achievementById('nope' as AchievementId)).toThrow();
  });
});
