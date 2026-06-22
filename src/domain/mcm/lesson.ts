/**
 * MCM (Mínimo Común Múltiplo / LCM) guided-lesson logic.
 *
 * Teaches the concept the way a kid can actually see it: list the multiples of
 * each number ("los saltos") and find the smallest one that appears in BOTH
 * lists. Difficulty ramps from numbers where one is a multiple of the other,
 * up to coprime-ish pairs with a larger LCM.
 *
 * Pure functions only — no React, no state. Tested-friendly.
 */

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

/**
 * Multiples of `n` from n·1 up to and including `max`, capped at `cap` chips so
 * the tracks never overflow the screen.
 */
export function multiplesUpTo(n: number, max: number, cap = 9): number[] {
  const out: number[] = [];
  for (let k = 1; n * k <= max && out.length < cap; k++) out.push(n * k);
  return out;
}

/** How much scaffolding a step gives the learner. */
export type Scaffold =
  | 'show'    // multiples always visible + common ones highlighted; tap the answer
  | 'reveal'  // multiples hidden behind a button; tap the answer
  | 'type';   // no help by default; type the answer (a hint reveals the tracks)

export interface LessonStep {
  a: number;
  b: number;
  /** The answer: smallest common multiple. */
  lcm: number;
  scaffold: Scaffold;
  /** Pre-computed multiple tracks for the visual method. */
  multiplesA: number[];
  multiplesB: number[];
}

/**
 * The ordered curriculum. Early pairs are tiny and one often divides the other
 * (LCM = the bigger number); later pairs force listing several multiples.
 */
const RAW: Array<[a: number, b: number, scaffold: Scaffold]> = [
  [2, 3, 'show'],   // 6  — the canonical "frogs meet at 6"
  [2, 4, 'show'],   // 4  — one is a multiple of the other
  [3, 6, 'show'],   // 6  — same idea, reinforce
  [4, 6, 'show'],   // 12 — first real "both lists grow"
  [3, 4, 'reveal'], // 12 — coprime, lists you must build
  [6, 8, 'reveal'], // 24
  [4, 5, 'type'],   // 20 — coprime, type it
  [6, 9, 'type'],   // 18
  [8, 12, 'type'],  // 24 — final challenge
];

export const MCM_LESSON: readonly LessonStep[] = RAW.map(([a, b, scaffold]) => {
  const answer = lcm(a, b);
  // Extend each track one common multiple past the answer (when it fits in the
  // cap) so the learner sees the answer is the *smallest* shared one, not the
  // only one.
  const max = Math.min(answer * 2, answer + Math.max(a, b) * 2);
  return {
    a,
    b,
    lcm: answer,
    scaffold,
    multiplesA: multiplesUpTo(a, max),
    multiplesB: multiplesUpTo(b, max),
  };
});

/** Classifies a tapped multiple so the UI can give a precise hint. */
export type TapVerdict = 'correct' | 'common-not-smallest' | 'only-a' | 'only-b';

export function classifyTap(value: number, step: LessonStep): TapVerdict {
  const inA = value % step.a === 0;
  const inB = value % step.b === 0;
  if (inA && inB) return value === step.lcm ? 'correct' : 'common-not-smallest';
  return inA ? 'only-a' : 'only-b';
}
