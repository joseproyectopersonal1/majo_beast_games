/**
 * Tienda Bestial — powerup catalog.
 *
 * Closed set of 6 powerups. IDs form a union type so callers get
 * compile-time exhaustiveness checks.
 *
 * Source of truth: tasks_for_AI/T02-beast-games-extras.md §F21.
 */

export type PowerupId =
  | 'pista'
  | 'congelar'
  | 'tiempo-extra'
  | 'vida-extra'
  | 'escudo'
  | 'doble-monedas';

export type PowerupKind = 'per-use' | 'per-round';

export type Powerup = {
  readonly id: PowerupId;
  readonly name: string;
  readonly emoji: string;
  readonly price: number;
  readonly kind: PowerupKind;
  readonly description: string;
};

export const POWERUPS: readonly Powerup[] = [
  {
    id: 'pista',
    name: 'Pista',
    emoji: '💡',
    price: 400,
    kind: 'per-use',
    description: 'Muestra la visualización del problema antes de responder.',
  },
  {
    id: 'congelar',
    name: 'Congelar tiempo',
    emoji: '🧊',
    price: 500,
    kind: 'per-round',
    description: 'Pausa el timer 10 segundos. Solo una vez por ronda.',
  },
  {
    id: 'tiempo-extra',
    name: 'Tiempo extra',
    emoji: '⏱️',
    price: 600,
    kind: 'per-round',
    description: '+5 segundos al límite de cada pregunta de la ronda.',
  },
  {
    id: 'vida-extra',
    name: 'Vida extra',
    emoji: '❤️',
    price: 800,
    kind: 'per-round',
    description: 'La ronda inicia con 4 vidas en vez de 3.',
  },
  {
    id: 'escudo',
    name: 'Escudo',
    emoji: '🛡️',
    price: 1000,
    kind: 'per-round',
    description: 'El primer error de la ronda no resta vida ni rompe tu racha.',
  },
  {
    id: 'doble-monedas',
    name: 'Doble monedas',
    emoji: '✨',
    price: 1200,
    kind: 'per-round',
    description: 'Todas las monedas de la ronda se duplican.',
  },
] as const;

/** Lookup by id. Throws if id is unknown (defensive — callers should use the union type). */
export function powerupById(id: PowerupId): Powerup {
  const found = POWERUPS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown powerup id: "${id}"`);
  return found;
}
