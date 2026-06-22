/**
 * Pure data + helpers for the per-island guided lessons (T07).
 *
 * Each island teaches its concept with a kid-friendly visual method and
 * progressive scaffolding: `show` (visual + tap an option) → `reveal` (visual
 * hidden behind a button) → `type` (type the answer, optional hint).
 *
 * This file holds ONLY numbers + math (no React) so it stays unit-testable.
 * The visuals and copy live in the matching ui/learn/* lesson components.
 */

export type Scaffold = 'show' | 'reveal' | 'type';

/* ── shared number helpers ───────────────────────────────────────── */

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function divisorsOf(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
  return out;
}

export function commonDivisors(a: number, b: number): number[] {
  return divisorsOf(a).filter((d) => b % d === 0);
}

/* ── Tablas — multiplication as groups/array ─────────────────────── */

export interface MulStep {
  a: number;
  b: number;
  scaffold: Scaffold;
  /** Tap options (include the answer). Only for show/reveal. */
  options?: number[];
}

export const TABLAS_STEPS: readonly MulStep[] = [
  { a: 3, b: 4, scaffold: 'show', options: [10, 12, 14] },
  { a: 2, b: 5, scaffold: 'show', options: [7, 10, 12] },
  { a: 4, b: 6, scaffold: 'reveal', options: [20, 24, 28] },
  { a: 6, b: 7, scaffold: 'type' },
  { a: 8, b: 8, scaffold: 'type' },
];

export const mulAnswer = (s: MulStep) => s.a * s.b;

/* ── Divisiones — sharing into equal groups ──────────────────────── */

export interface DivStep {
  total: number;
  groups: number;
  scaffold: Scaffold;
  options?: number[];
}

export const DIVISIONES_STEPS: readonly DivStep[] = [
  { total: 12, groups: 3, scaffold: 'show', options: [3, 4, 6] },
  { total: 10, groups: 2, scaffold: 'show', options: [4, 5, 8] },
  { total: 15, groups: 3, scaffold: 'reveal', options: [3, 5, 6] },
  { total: 24, groups: 4, scaffold: 'type' },
  { total: 28, groups: 7, scaffold: 'type' },
];

export const divAnswer = (s: DivStep) => s.total / s.groups;

/* ── Varias cifras — two-digit × one-digit by place value ────────── */

export interface MdStep {
  a: number; // two-digit
  b: number; // one-digit
  scaffold: Scaffold;
  options?: number[];
}

export const VARIAS_STEPS: readonly MdStep[] = [
  { a: 12, b: 3, scaffold: 'show', options: [33, 36, 39] },
  { a: 11, b: 4, scaffold: 'show', options: [40, 44, 48] },
  { a: 14, b: 3, scaffold: 'reveal', options: [42, 44, 46] },
  { a: 13, b: 5, scaffold: 'type' },
  { a: 16, b: 4, scaffold: 'type' },
];

export interface Decomposition {
  tens: number;
  units: number;
  partialTens: number;
  partialUnits: number;
  total: number;
}

export function decompose(a: number, b: number): Decomposition {
  const tens = Math.floor(a / 10) * 10;
  const units = a % 10;
  return {
    tens,
    units,
    partialTens: tens * b,
    partialUnits: units * b,
    total: a * b,
  };
}

export const mdAnswer = (s: MdStep) => s.a * s.b;

/* ── Analíticos — number patterns (constant step) ────────────────── */

export interface PatStep {
  start: number;
  diff: number;
  /** How many terms are shown before the "?". */
  terms: number;
  scaffold: Scaffold;
  options?: number[];
}

export const ANALITICOS_STEPS: readonly PatStep[] = [
  { start: 2, diff: 2, terms: 4, scaffold: 'show', options: [8, 10, 12] },
  { start: 5, diff: 5, terms: 3, scaffold: 'show', options: [15, 20, 25] },
  { start: 3, diff: 3, terms: 4, scaffold: 'reveal', options: [14, 15, 18] },
  { start: 4, diff: 4, terms: 4, scaffold: 'type' },
  { start: 2, diff: 5, terms: 4, scaffold: 'type' },
];

/** The terms shown before the missing one. */
export function patternTerms(s: PatStep): number[] {
  return Array.from({ length: s.terms }, (_, i) => s.start + s.diff * i);
}

/** The missing next term (the answer). */
export const patAnswer = (s: PatStep) => s.start + s.diff * s.terms;

/* ── MCD — greatest common divisor ───────────────────────────────── */

export interface McdStep {
  a: number;
  b: number;
  scaffold: Scaffold;
}

export const MCD_STEPS: readonly McdStep[] = [
  { a: 6, b: 9, scaffold: 'show' },
  { a: 8, b: 12, scaffold: 'show' },
  { a: 12, b: 18, scaffold: 'reveal' },
  { a: 10, b: 15, scaffold: 'type' },
  { a: 16, b: 24, scaffold: 'type' },
];

export const mcdAnswer = (s: McdStep) => gcd(s.a, s.b);
