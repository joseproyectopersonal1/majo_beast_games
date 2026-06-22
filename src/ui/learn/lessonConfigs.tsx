/**
 * Per-island guided-lesson configs. Each exports a ready-to-render component
 * that feeds a LessonConfig into the shared <GuidedLesson> engine.
 *
 *   TablasLesson       — multiplication as groups
 *   DivisionesLesson   — division as equal sharing
 *   VariasCifrasLesson — two-digit × one-digit by place value
 *   AnaliticosLesson   — number patterns
 *   McdLesson          — greatest common divisor
 *
 * (MCM keeps its own bespoke McmLesson with the "frogs in the tracks" tap.)
 */

'use client';

import { GuidedLesson, type GuidedStep, type LessonConfig } from './GuidedLesson';
import { DotArray, ShareGroups, Decompose, SequenceStrip, DivisorTracks } from './widgets';
import {
  TABLAS_STEPS, mulAnswer,
  DIVISIONES_STEPS, divAnswer,
  VARIAS_STEPS, mdAnswer, decompose,
  ANALITICOS_STEPS, patternTerms, patAnswer,
  MCD_STEPS, mcdAnswer, commonDivisors,
} from '@/domain/learn/lessons';

const FONT = 'var(--font-display), system-ui';

/* ── Shared header bits ──────────────────────────────────────────── */

function MathRow({ a, op, b, answer, solved }: { a: number; op: string; b: number; answer: number; solved: boolean }) {
  return (
    <span className="flex items-center gap-2" style={{ fontFamily: FONT }}>
      <span className="text-4xl text-white">{a}</span>
      <span className="text-3xl" style={{ color: 'var(--color-gold-2)' }}>{op}</span>
      <span className="text-4xl text-white">{b}</span>
      <span className="text-3xl text-white/40">=</span>
      <span className="text-4xl" style={{ color: 'var(--color-gold)' }}>{solved ? answer : '?'}</span>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/* Tablas                                                            */
/* ════════════════════════════════════════════════════════════════ */

export function TablasLesson() {
  const steps: GuidedStep[] = TABLAS_STEPS.map((s) => {
    const ans = mulAnswer(s);
    return {
      question: (solved) => <MathRow a={s.a} op="×" b={s.b} answer={ans} solved={solved} />,
      answer: ans,
      scaffold: s.scaffold,
      instruction: s.scaffold === 'type' ? `¿Cuánto es ${s.a} × ${s.b}?` : 'Cuenta los puntos y toca el total.',
      visual: <DotArray rows={s.a} cols={s.b} />,
      options: s.options,
      explain: (ok, picked) =>
        ok
          ? `¡Sí! ${s.a} × ${s.b} = ${s.a} grupos de ${s.b} = ${ans}.`
          : `Casi. Cuenta otra vez: ${s.a} filas de ${s.b}. El ${picked} no es.`,
    };
  });

  const config: LessonConfig = {
    introTitle: '¿Qué es multiplicar?',
    introBody: (
      <>
        <p>Multiplicar es sumar el mismo número varias veces, en <b>grupos iguales</b>.</p>
        <DotArray rows={2} cols={3} />
        <p><b style={{ color: 'var(--color-gold)' }}>2 × 3</b> son 2 grupos de 3 = 3 + 3 = <b>6</b>.</p>
      </>
    ),
    steps,
    doneTitle: '¡Ya multiplicas!',
    doneHint: 'Multiplicar = sumar grupos iguales.',
    playHref: '/jugar/tablas/reto-reloj',
  };
  return <GuidedLesson config={config} />;
}

/* ════════════════════════════════════════════════════════════════ */
/* Divisiones                                                        */
/* ════════════════════════════════════════════════════════════════ */

export function DivisionesLesson() {
  const steps: GuidedStep[] = DIVISIONES_STEPS.map((s) => {
    const ans = divAnswer(s);
    return {
      question: (solved) => <MathRow a={s.total} op="÷" b={s.groups} answer={ans} solved={solved} />,
      answer: ans,
      scaffold: s.scaffold,
      instruction: s.scaffold === 'type' ? `Reparte ${s.total} en ${s.groups} grupos. ¿Cuántos en cada uno?` : 'Mira cuántos caen en cada grupo y tócalo.',
      visual: <ShareGroups total={s.total} groups={s.groups} />,
      options: s.options,
      explain: (ok, picked) =>
        ok
          ? `¡Sí! ${s.total} ÷ ${s.groups} = ${ans} en cada grupo.`
          : `Reparte ${s.total} en ${s.groups} grupos iguales. El ${picked} no es.`,
    };
  });

  const config: LessonConfig = {
    introTitle: '¿Qué es dividir?',
    introBody: (
      <>
        <p>Dividir es <b>repartir en partes iguales</b>. Cuántos le tocan a cada uno.</p>
        <ShareGroups total={6} groups={2} />
        <p><b style={{ color: 'var(--color-gold)' }}>6 ÷ 2</b> = repartir 6 entre 2 = <b>3</b> en cada grupo.</p>
      </>
    ),
    steps,
    doneTitle: '¡Ya divides!',
    doneHint: 'Dividir = repartir en partes iguales.',
    playHref: '/jugar/divisiones/reto-reloj',
  };
  return <GuidedLesson config={config} />;
}

/* ════════════════════════════════════════════════════════════════ */
/* Varias cifras                                                     */
/* ════════════════════════════════════════════════════════════════ */

export function VariasCifrasLesson() {
  const steps: GuidedStep[] = VARIAS_STEPS.map((s) => {
    const ans = mdAnswer(s);
    const d = decompose(s.a, s.b);
    return {
      question: (solved) => <MathRow a={s.a} op="×" b={s.b} answer={ans} solved={solved} />,
      answer: ans,
      scaffold: s.scaffold,
      instruction: s.scaffold === 'type' ? `Separa ${s.a} en decenas y unidades, multiplica y suma.` : 'Sigue los pasos y toca el resultado.',
      visual: <Decompose a={s.a} b={s.b} />,
      options: s.options,
      explain: (ok, picked) =>
        ok
          ? `¡Sí! (${d.tens}×${s.b}) + (${d.units}×${s.b}) = ${d.partialTens} + ${d.partialUnits} = ${ans}.`
          : `Recuerda: ${s.a} = ${d.tens} + ${d.units}. Multiplica cada parte. El ${picked} no es.`,
    };
  });

  const config: LessonConfig = {
    introTitle: 'Multiplicar números grandes',
    introBody: (
      <>
        <p>El truco: <b>separa el número en decenas y unidades</b>, multiplica cada parte y súmalas.</p>
        <Decompose a={12} b={3} />
        <p>Así un número grande se vuelve dos fáciles.</p>
      </>
    ),
    steps,
    doneTitle: '¡Números grandes dominados!',
    doneHint: 'Separa en decenas + unidades, multiplica y suma.',
    playHref: '/jugar/varias-cifras/reto-reloj',
  };
  return <GuidedLesson config={config} />;
}

/* ════════════════════════════════════════════════════════════════ */
/* Analíticos (patrones)                                             */
/* ════════════════════════════════════════════════════════════════ */

function SeqHeader({ terms, answer, solved }: { terms: number[]; answer: number; solved: boolean }) {
  const cells: (number | null)[] = [...terms, solved ? answer : null];
  return (
    <span className="flex items-center gap-1 flex-wrap justify-center" style={{ fontFamily: FONT }}>
      {cells.map((v, i) => (
        <span key={i} className="flex items-center">
          <span className="text-2xl" style={{ color: v === null ? 'var(--color-gold)' : (solved && i === cells.length - 1 ? 'var(--color-lime)' : '#fff') }}>
            {v === null ? '?' : v}
          </span>
          {i < cells.length - 1 && <span className="text-xl text-white/35 mx-1">,</span>}
        </span>
      ))}
    </span>
  );
}

export function AnaliticosLesson() {
  const steps: GuidedStep[] = ANALITICOS_STEPS.map((s) => {
    const terms = patternTerms(s);
    const ans = patAnswer(s);
    return {
      question: (solved) => <SeqHeader terms={terms} answer={ans} solved={solved} />,
      answer: ans,
      scaffold: s.scaffold,
      instruction: s.scaffold === 'type' ? 'Escribe el número que sigue.' : 'Descubre cuánto sube cada vez y toca el que sigue.',
      visual: <SequenceStrip terms={terms} diff={s.diff} answer={ans} solved={false} />,
      options: s.options,
      explain: (ok, picked) =>
        ok
          ? `¡Sí! Sube ${s.diff} cada vez, así que sigue el ${ans}.`
          : `Mira cuánto sube de un número al siguiente. El ${picked} no es.`,
    };
  });

  const config: LessonConfig = {
    introTitle: 'Encuentra el patrón',
    introBody: (
      <>
        <p>En una serie de números, busca <b>cuánto sube cada vez</b>. Eso es el patrón.</p>
        <SequenceStrip terms={[5, 10, 15]} diff={5} answer={20} solved />
        <p>Sube 5 cada vez → después del 15 sigue el <b style={{ color: 'var(--color-gold)' }}>20</b>.</p>
      </>
    ),
    steps,
    doneTitle: '¡Detective de patrones!',
    doneHint: 'Mira cuánto sube cada vez y repite el salto.',
    playHref: '/jugar/analiticos/reto-reloj',
  };
  return <GuidedLesson config={config} />;
}

/* ════════════════════════════════════════════════════════════════ */
/* MCD                                                               */
/* ════════════════════════════════════════════════════════════════ */

function McdHeader({ a, b, answer, solved }: { a: number; b: number; answer: number; solved: boolean }) {
  return (
    <span className="flex items-center gap-1" style={{ fontFamily: FONT }}>
      <span className="text-xl mr-1" style={{ color: 'var(--color-gold-2)' }}>MCD</span>
      <span className="text-3xl text-white/35">(</span>
      <span className="text-4xl text-white">{a}</span>
      <span className="text-3xl text-white/35">,</span>
      <span className="text-4xl text-white">{b}</span>
      <span className="text-3xl text-white/35">)</span>
      <span className="text-3xl text-white/40">=</span>
      <span className="text-4xl" style={{ color: 'var(--color-gold)' }}>{solved ? answer : '?'}</span>
    </span>
  );
}

export function McdLesson() {
  const steps: GuidedStep[] = MCD_STEPS.map((s) => {
    const ans = mcdAnswer(s);
    return {
      question: (solved) => <McdHeader a={s.a} b={s.b} answer={ans} solved={solved} />,
      answer: ans,
      scaffold: s.scaffold,
      instruction: s.scaffold === 'type' ? `¿Cuál es el número más grande que divide a ${s.a} y a ${s.b}?` : 'Toca el número más GRANDE que esté en las dos listas.',
      visual: <DivisorTracks a={s.a} b={s.b} answer={ans} solved={false} />,
      options: s.scaffold === 'type' ? undefined : commonDivisors(s.a, s.b),
      explain: (ok, picked) =>
        ok
          ? `¡Sí! ${ans} es el número más grande que divide a ${s.a} y a ${s.b}. Ese es el MCD.`
          : s.a % picked === 0 && s.b % picked === 0
            ? `El ${picked} sí divide a los dos, pero hay uno más grande. 👀`
            : `El ${picked} no divide a los dos. Busca uno que sí.`,
    };
  });

  const config: LessonConfig = {
    introTitle: '¿Qué es el MCD?',
    introBody: (
      <>
        <p><b style={{ color: 'var(--color-gold)' }}>MCD</b> = Máximo Común Divisor: el número <b>más grande</b> que cabe exacto en los dos.</p>
        <DivisorTracks a={6} b={9} answer={3} solved />
        <p>El más grande que está en las dos listas de divisores de 6 y 9 es el <b style={{ color: 'var(--color-gold)' }}>3</b>.</p>
      </>
    ),
    steps,
    doneTitle: '¡Ya entiendes el MCD!',
    doneHint: 'Lista los divisores de cada uno y toma el más grande que se repite.',
    playHref: '/jugar/mcm-mcd/reto-reloj',
  };
  return <GuidedLesson config={config} />;
}
