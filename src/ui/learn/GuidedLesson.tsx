/**
 * GuidedLesson — the shared engine behind every island's guided lesson.
 *
 * A lesson is just a config: an intro (concept + mini visual) and a list of
 * steps. Each step shows a concept-specific teaching VISUAL and asks for the
 * answer either by tapping an option or typing it, with progressive
 * scaffolding (show → reveal → type) and precise, encouraging feedback.
 *
 * The MCM lesson predates this and keeps its own bespoke "tap in the tracks"
 * interaction; everything else (tablas, divisiones, varias-cifras, analíticos,
 * MCD) is expressed as a GuidedLesson config.
 */

'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/ui/shared';
import { NumericInput } from '@/ui/game';
import { BeastMascot } from '@/ui/brand';
import { audioManager } from '@/infra/audio/manager';
import type { Scaffold } from '@/domain/learn/lessons';

export interface GuidedStep {
  /** Header question; receives whether the step is solved so it can reveal the answer. */
  question: (solved: boolean) => ReactNode;
  answer: number;
  scaffold: Scaffold;
  instruction: string;
  /** Concept-specific teaching aid. Shown when scaffold==='show' or revealed. */
  visual?: ReactNode;
  /** Tap options for show/reveal steps (must include the answer). */
  options?: number[];
  /** Feedback message for a chosen/typed value. */
  explain: (correct: boolean, picked: number) => string;
}

export interface LessonConfig {
  introTitle: string;
  introBody: ReactNode;
  steps: GuidedStep[];
  doneTitle: string;
  doneHint: ReactNode;
  /** "Jugar el reto" destination. */
  playHref: string;
}

const DIFFICULTY: Record<Scaffold, { label: string; color: string }> = {
  show: { label: 'Fácil', color: 'var(--color-lime)' },
  reveal: { label: 'Medio', color: 'var(--color-gold)' },
  type: { label: 'Reto', color: 'var(--color-magenta)' },
};

export function GuidedLesson({ config }: { config: LessonConfig }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);

  const step = config.steps[index]!;
  const total = config.steps.length;
  const solved = feedback?.ok === true;
  const showVisual = step.scaffold === 'show' || revealed;

  function evaluate(picked: number) {
    if (solved) return;
    if (picked === step.answer) {
      audioManager.play('correct');
      setTimeout(() => audioManager.play('prize'), 160);
      setCorrect((c) => c + 1);
      setFeedback({ ok: true, msg: step.explain(true, picked) });
    } else {
      audioManager.play('wrong');
      setFeedback({ ok: false, msg: step.explain(false, picked) });
    }
  }

  function next() {
    if (index + 1 >= total) {
      audioManager.play('victory');
      setPhase('done');
      return;
    }
    setIndex((i) => i + 1);
    setFeedback(null);
    setRevealed(false);
  }

  function restart() {
    setIndex(0);
    setFeedback(null);
    setRevealed(false);
    setCorrect(0);
    setPhase('intro');
  }

  /* ── Intro ───────────────────────────────────────────────────────── */
  if (phase === 'intro') {
    return (
      <main className="min-h-full flex flex-col px-5 pt-5 pb-10 gap-5 max-w-sm mx-auto">
        <BackLink onClick={() => router.back()} />
        <motion.div
          className="beast-frame-glow flex flex-col items-center text-center gap-4 px-5 py-7"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BeastMascot size={88} float />
          <h1 className="uppercase beast-title text-3xl" style={{ fontFamily: 'var(--font-display), system-ui' }}>
            {config.introTitle}
          </h1>
          <div className="text-sm text-white/75 leading-relaxed flex flex-col gap-3 w-full">
            {config.introBody}
          </div>
          <Button fullWidth size="lg" onClick={() => setPhase('play')}>
            ¡Vamos a practicar!
          </Button>
        </motion.div>
      </main>
    );
  }

  /* ── Done ────────────────────────────────────────────────────────── */
  if (phase === 'done') {
    return (
      <motion.main
        className="min-h-full flex flex-col items-center justify-center px-6 gap-6 text-center max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <span className="text-7xl" aria-hidden>🧠</span>
        <h1 className="uppercase beast-title text-4xl" style={{ fontFamily: 'var(--font-display), system-ui' }}>
          {config.doneTitle}
        </h1>
        <p className="text-sm text-white/60">
          Acertaste <b style={{ color: 'var(--color-lime)' }}>{correct}</b> de {total}.
          <br />
          {config.doneHint}
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Button fullWidth size="lg" onClick={() => router.push(config.playHref)}>
            Jugar el reto
          </Button>
          <Button variant="ghost" fullWidth onClick={restart}>
            Repasar la lección
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.back()}>
            Volver
          </Button>
        </div>
      </motion.main>
    );
  }

  /* ── Play ────────────────────────────────────────────────────────── */
  const diff = DIFFICULTY[step.scaffold];

  return (
    <main className="min-h-full flex flex-col px-5 pt-4 pb-8 gap-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackLink onClick={() => router.back()} />
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ color: diff.color, background: `color-mix(in srgb, ${diff.color} 16%, transparent)` }}
          >
            {diff.label}
          </span>
          <span className="text-xs text-white/35">{index + 1} / {total}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: 'var(--color-gold)' }} animate={{ width: `${(index / total) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="beast-frame flex items-center justify-center py-4 mt-1">
        {step.question(solved)}
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-white/70">{step.instruction}</p>

      {/* Visual teaching aid */}
      <AnimatePresence initial={false}>
        {showVisual && step.visual && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {step.visual}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal / hint */}
      {!showVisual && step.scaffold === 'reveal' && (
        <Button variant="ghost" fullWidth onClick={() => setRevealed(true)}>
          👀 Ver la ayuda
        </Button>
      )}
      {!showVisual && step.scaffold === 'type' && step.visual && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="self-center text-sm px-3 py-1.5 rounded-full cursor-pointer transition-colors"
          style={{ color: 'var(--color-gold)', background: 'color-mix(in srgb, var(--color-gold) 12%, transparent)' }}
        >
          💡 Pista
        </button>
      )}

      {/* Interaction */}
      {step.scaffold === 'type' ? (
        !solved && <NumericInput onConfirm={evaluate} resetKey={index} />
      ) : (
        <OptionRow options={step.options ?? []} answer={step.answer} solved={solved} onPick={evaluate} />
      )}

      {/* Feedback */}
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.msg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl px-4 py-3 text-center text-sm font-medium"
            style={{
              background: feedback.ok
                ? 'color-mix(in srgb, var(--color-lime) 14%, var(--color-panel))'
                : 'color-mix(in srgb, var(--color-red-glow) 12%, var(--color-panel))',
              color: feedback.ok ? 'var(--color-lime)' : '#ffd0d0',
              border: `1px solid ${feedback.ok ? 'color-mix(in srgb, var(--color-lime) 40%, transparent)' : 'color-mix(in srgb, var(--color-red-glow) 35%, transparent)'}`,
            }}
          >
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next */}
      {solved && (
        <Button fullWidth size="lg" onClick={next}>
          {index + 1 >= total ? 'Terminar' : 'Siguiente →'}
        </Button>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start text-sm text-white/50 hover:text-white/90 transition-colors cursor-pointer"
    >
      ← Volver
    </button>
  );
}

function OptionRow({
  options,
  answer,
  solved,
  onPick,
}: {
  options: number[];
  answer: number;
  solved: boolean;
  onPick: (v: number) => void;
}) {
  return (
    <div className="flex justify-center gap-3 flex-wrap">
      {options.map((v) => {
        const isAnswer = v === answer;
        const highlight = solved && isAnswer;
        return (
          <motion.button
            key={v}
            type="button"
            whileTap={!solved ? { scale: 0.92 } : undefined}
            onClick={() => onPick(v)}
            disabled={solved}
            className="min-w-16 h-14 px-4 rounded-xl text-2xl leading-none flex items-center justify-center"
            style={{
              fontFamily: 'var(--font-display), system-ui',
              background: highlight ? 'color-mix(in srgb, var(--color-lime) 22%, var(--color-panel))' : 'var(--color-panel-2)',
              color: highlight ? 'var(--color-lime)' : '#fff',
              border: `2px solid ${highlight ? 'var(--color-lime)' : 'color-mix(in srgb, var(--color-gold) 22%, transparent)'}`,
              opacity: solved && !isAnswer ? 0.4 : 1,
              cursor: solved ? 'default' : 'pointer',
            }}
          >
            {v}
          </motion.button>
        );
      })}
    </div>
  );
}
