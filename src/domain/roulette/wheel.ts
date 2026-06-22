/**
 * Ruleta Bestial — pure wheel domain.
 *
 * Source of truth: tasks_for_AI/T04-ruleta-navegacion.md §B.2-B.3.
 *
 * Business rules (closed):
 * - 8 segments, every one is a prize (zero "lose a turn").
 * - Probabilities are fixed and honest — no near-miss manipulation.
 * - Spins can only be EARNED, never bought.
 */

export type SegmentKind = 'coins' | 'powerup' | 'x2-next' | 'reto' | 'bestial';

export type Segment = {
  readonly id: string;
  /** Short UI label (Spanish). */
  readonly label: string;
  readonly kind: SegmentKind;
  /** Coin value for 'coins'/'bestial'; 0 for non-coin kinds. */
  readonly value: number;
  /** Probability in [0,1]. All segments sum to exactly 1. */
  readonly probability: number;
  /** Wedge fill color (CSS). */
  readonly color: string;
  readonly emoji: string;
};

export const SEGMENTS: readonly Segment[] = [
  { id: 'coins-100', label: '100', kind: 'coins', value: 100, probability: 0.2, color: '#8B7CFF', emoji: '🪙' },
  { id: 'coins-200', label: '200', kind: 'coins', value: 200, probability: 0.2, color: '#4DA6FF', emoji: '🪙' },
  { id: 'coins-300', label: '300', kind: 'coins', value: 300, probability: 0.15, color: '#FF2D78', emoji: '🪙' },
  { id: 'coins-500', label: '500', kind: 'coins', value: 500, probability: 0.1, color: '#FFA94D', emoji: '🪙' },
  { id: 'powerup', label: 'Poder', kind: 'powerup', value: 0, probability: 0.15, color: '#39FF88', emoji: '💡' },
  { id: 'x2-next', label: 'x2 ronda', kind: 'x2-next', value: 0, probability: 0.1, color: '#FFC300', emoji: '✨' },
  { id: 'reto', label: 'Reto', kind: 'reto', value: 0, probability: 0.08, color: '#FF6B9D', emoji: '❓' },
  { id: 'bestial', label: 'GRAN', kind: 'bestial', value: 1000, probability: 0.02, color: 'url(#bestialGradient)', emoji: '👑' },
] as const;

/**
 * Validate that a segment list's probabilities sum to exactly 1.0.
 * Integer arithmetic (basis points) avoids float drift. Throws otherwise.
 * Exported so tests can exercise the failure path with a bad catalog.
 */
export function assertProbabilitiesSumToOne(segments: readonly Segment[]): void {
  const totalBp = segments.reduce((acc, s) => acc + Math.round(s.probability * 10_000), 0);
  if (totalBp !== 10_000) {
    throw new Error(`Roulette probabilities must sum to 1.0 — got ${totalBp / 10_000}`);
  }
}

// Module-load validation: the closed catalog MUST be honest.
assertProbabilitiesSumToOne(SEGMENTS);

/** Lookup by id. Throws on unknown id (defensive). */
export function segmentById(id: string): Segment {
  const found = SEGMENTS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown roulette segment id: "${id}"`);
  return found;
}

/**
 * Spin the wheel — pure and deterministic given the injected `rand`.
 *
 * Walks the cumulative probability distribution and returns the segment
 * where rand() lands. `rand` must return a number in [0, 1).
 */
export function spin(rand: () => number): Segment {
  const r = rand();
  let cumulative = 0;
  // Walk all but the last segment; the last one absorbs the remainder so
  // float drift at the top of the range can never produce "no segment".
  for (let i = 0; i < SEGMENTS.length - 1; i++) {
    cumulative += SEGMENTS[i]!.probability;
    if (r < cumulative) return SEGMENTS[i]!;
  }
  return SEGMENTS[SEGMENTS.length - 1]!;
}

/**
 * Visual angle range for a segment index.
 *
 * The 8 wedges are drawn EQUAL at 45° each — probability does NOT change
 * the wedge size. This is the standard for prize wheels: it avoids visually
 * communicating "the jackpot is tiny", keeps the wheel readable, and the
 * honest odds live entirely in `spin()`.
 *
 * Angles are degrees clockwise from 12 o'clock (where the needle sits).
 */
export function segmentAngle(index: number): { start: number; end: number } {
  if (!Number.isInteger(index) || index < 0 || index >= SEGMENTS.length) {
    throw new Error(`Segment index out of range: ${index}`);
  }
  const sweep = 360 / SEGMENTS.length; // 45°
  return { start: index * sweep, end: (index + 1) * sweep };
}
