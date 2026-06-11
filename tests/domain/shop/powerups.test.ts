/**
 * Tests for domain/shop/powerups.ts and domain/shop/effects.ts
 */

import { describe, it, expect } from 'vitest';
import { POWERUPS, powerupById } from '@/domain/shop/powerups';
import type { PowerupId } from '@/domain/shop/powerups';
import { buildEffects, NO_EFFECTS } from '@/domain/shop/effects';

describe('powerups catalog', () => {
  it('has exactly 6 powerups', () => {
    expect(POWERUPS).toHaveLength(6);
  });

  it('has unique IDs', () => {
    const ids = POWERUPS.map((p) => p.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('contains all required IDs', () => {
    const ids = new Set(POWERUPS.map((p) => p.id));
    expect(ids.has('pista')).toBe(true);
    expect(ids.has('congelar')).toBe(true);
    expect(ids.has('tiempo-extra')).toBe(true);
    expect(ids.has('vida-extra')).toBe(true);
    expect(ids.has('escudo')).toBe(true);
    expect(ids.has('doble-monedas')).toBe(true);
  });

  it('has correct prices', () => {
    const prices: Record<PowerupId, number> = {
      'pista': 400,
      'congelar': 500,
      'tiempo-extra': 600,
      'vida-extra': 800,
      'escudo': 1000,
      'doble-monedas': 1200,
    };
    for (const p of POWERUPS) {
      expect(p.price).toBe(prices[p.id]);
    }
  });

  it('pista is per-use; all others are per-round', () => {
    const pista = POWERUPS.find((p) => p.id === 'pista')!;
    expect(pista.kind).toBe('per-use');
    for (const p of POWERUPS.filter((p) => p.id !== 'pista')) {
      expect(p.kind).toBe('per-round');
    }
  });

  it('powerupById returns the correct powerup', () => {
    const p = powerupById('escudo');
    expect(p.price).toBe(1000);
    expect(p.emoji).toBe('🛡️');
  });

  it('powerupById throws for unknown id', () => {
    expect(() => powerupById('nonexistent' as PowerupId)).toThrow();
  });
});

describe('buildEffects', () => {
  it('returns NO_EFFECTS for empty activation list', () => {
    expect(buildEffects([])).toEqual(NO_EFFECTS);
  });

  it('pista adds 1 hint per activation', () => {
    const fx = buildEffects(['pista', 'pista']);
    expect(fx.hintsAvailable).toBe(2);
  });

  it('congelar enables freeze', () => {
    const fx = buildEffects(['congelar']);
    expect(fx.freezeAvailable).toBe(true);
  });

  it('tiempo-extra adds 5000ms per activation', () => {
    const fx = buildEffects(['tiempo-extra', 'tiempo-extra']);
    expect(fx.extraTimeMs).toBe(10_000);
  });

  it('vida-extra adds 1 life', () => {
    const fx = buildEffects(['vida-extra']);
    expect(fx.extraLives).toBe(1);
  });

  it('escudo activates shield', () => {
    const fx = buildEffects(['escudo']);
    expect(fx.shieldActive).toBe(true);
  });

  it('doble-monedas sets multiplier to 2 (activating twice is still 2)', () => {
    const fx = buildEffects(['doble-monedas', 'doble-monedas']);
    expect(fx.coinMultiplier).toBe(2);
  });

  it('combination of all powerups', () => {
    const fx = buildEffects(['pista', 'congelar', 'tiempo-extra', 'vida-extra', 'escudo', 'doble-monedas']);
    expect(fx.hintsAvailable).toBe(1);
    expect(fx.freezeAvailable).toBe(true);
    expect(fx.extraTimeMs).toBe(5_000);
    expect(fx.extraLives).toBe(1);
    expect(fx.shieldActive).toBe(true);
    expect(fx.coinMultiplier).toBe(2);
  });

  it('no powerups → coinMultiplier is 1', () => {
    const fx = buildEffects([]);
    expect(fx.coinMultiplier).toBe(1);
  });
});
