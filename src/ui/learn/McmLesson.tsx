/**
 * McmLesson — a dynamic, hand-held way to LEARN the MCM (LCM) from zero.
 *
 * Pedagogy: the "frogs jumping" metaphor. Each number's multiples are the spots
 * a frog lands on; the MCM is the first spot where both frogs land together.
 * The learner literally taps the smallest number that shows up in both tracks.
 *
 * Difficulty ramps automatically (see MCM_LESSON):
 *   show   → multiples visible, common ones highlighted (tap the answer)
 *   reveal → multiples hidden until asked for (tap the answer)
 *   type   → no help by default; type the answer (a hint reveals the tracks)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/ui/shared';
import { NumericInput } from '@/ui/game';
import { BeastMascot } from '@/ui/brand';
import { audioManager } from '@/infra/audio/manager';
import { MCM_LESSON, classifyTap, type LessonStep } from '@/domain/mcm/lesson';

type Phase = 'intro' | 'play' | 'done';

const DIFFICULTY: Record<LessonStep['scaffold'], { label: string; color: string }> = {
  show: { label: 'Fácil', color: 'var(--color-lime)' },
  reveal: { label: 'Medio', color: 'var(--color-gold)' },
  type: { label: 'Reto', color: 'var(--color-magenta)' },
};

export function McmLesson() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const step = MCM_LESSON[stepIndex]!;
  const total = MCM_LESSON.length;
  const solved = feedback?.ok === true;
  const showTracks = step.scaffold === 'show' || revealed;

  /* ── Answer handling ─────────────────────────────────────────────── */

  function evaluate(value: number) {
    if (solved) return;
    const verdict = classifyTap(value, step);
    if (verdict === 'correct') {
      audioManager.play('correct');
      setTimeout(() => audioManager.play('prize'), 160);
      setCorrectCount((c) => c + 1);
      setFeedback({
        ok: true,
        msg: `¡Sí! ${step.lcm} es el número más pequeño que aparece en las dos listas. Ese es el MCM.`,
      });
      return;
    }
    audioManager.play('wrong');
    let msg: string;
    if (verdict === 'common-not-smallest') {
      msg = `¡Casi! El ${value} sí está en las dos listas, pero hay uno más pequeño. 👀`;
    } else if (verdict === 'only-a') {
      msg = `El ${value} solo aparece en los saltos del ${step.a}. Busca uno que también esté en los del ${step.b}.`;
    } else {
      msg = `El ${value} solo aparece en los saltos del ${step.b}. Busca uno que también esté en los del ${step.a}.`;
    }
    setFeedback({ ok: false, msg });
  }

  function handleType(value: number) {
    if (value === step.lcm) {
      evaluate(value);
    } else {
      audioManager.play('wrong');
      setFeedback({
        ok: false,
        msg: `Mmm, ${value} no es. Toca 💡 Pista para ver los saltos de cada número.`,
      });
    }
  }

  function next() {
    if (stepIndex + 1 >= total) {
      audioManager.play('victory');
      setPhase('done');
      return;
    }
    setStepIndex((i) => i + 1);
    setFeedback(null);
    setRevealed(false);
  }

  function restart() {
    setStepIndex(0);
    setFeedback(null);
    setRevealed(false);
    setCorrectCount(0);
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
          <BeastMascot size={92} float />
          <h1 className="uppercase beast-title text-3xl" style={{ fontFamily: 'var(--font-display), system-ui' }}>
            ¿Qué es el MCM?
          </h1>
          <p className="text-sm text-white/70 leading-relaxed">
            <b style={{ color: 'var(--color-gold)' }}>MCM</b> = Mínimo Común Múltiplo.
            <br />
            Imagina dos ranitas 🐸 que saltan por una recta de números: una salta
            de <b>2 en 2</b> y la otra de <b>3 en 3</b>.
          </p>

          {/* Concrete mini-example */}
          <div className="w-full flex flex-col gap-2 mt-1">
            <MiniTrack label="Salta de 2" emoji="🐸" values={[2, 4, 6]} meet={6} color="var(--color-lime)" />
            <MiniTrack label="Salta de 3" emoji="🐸" values={[3, 6]} meet={6} color="var(--color-cyan)" />
          </div>
          <p className="text-sm text-white/70">
            Las dos caen juntas por primera vez en el{' '}
            <b style={{ color: 'var(--color-gold)' }}>6</b>.
            <br />
            ¡Ese es el MCM de 2 y 3!
          </p>

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
          ¡Ya entiendes el MCM!
        </h1>
        <p className="text-sm text-white/60">
          Acertaste <b style={{ color: 'var(--color-lime)' }}>{correctCount}</b> de {total}.
          <br />
          Recuerda: lista los saltos de cada número y busca el primero que se repite.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Button fullWidth size="lg" onClick={() => router.push('/jugar/mcm-mcd/reto-reloj')}>
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
          <span className="text-xs text-white/35">{stepIndex + 1} / {total}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--color-gold)' }}
          animate={{ width: `${(stepIndex / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="beast-frame flex items-center justify-center gap-1 py-4 mt-1">
        <span className="text-xl mr-1" style={{ fontFamily: 'var(--font-display), system-ui', color: 'var(--color-gold-2)' }}>
          MCM
        </span>
        <Token>(</Token>
        <Token strong>{step.a}</Token>
        <Token>,</Token>
        <Token strong>{step.b}</Token>
        <Token>)</Token>
        <Token>=</Token>
        <span className="text-4xl" style={{ fontFamily: 'var(--font-display), system-ui', color: 'var(--color-gold)' }}>
          {solved ? step.lcm : '?'}
        </span>
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-white/70">
        {step.scaffold === 'type'
          ? `Escribe el MCM de ${step.a} y ${step.b}.`
          : 'Toca el número más pequeño que esté en las DOS listas.'}
      </p>

      {/* Tracks (the visual method) */}
      <AnimatePresence>
        {showTracks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-3 overflow-hidden"
          >
            <Track
              label={`Saltos del ${step.a}`}
              color="var(--color-lime)"
              values={step.multiplesA}
              step={step}
              solved={solved}
              tappable={step.scaffold !== 'type'}
              highlightCommon={step.scaffold === 'show'}
              onTap={evaluate}
            />
            <Track
              label={`Saltos del ${step.b}`}
              color="var(--color-cyan)"
              values={step.multiplesB}
              step={step}
              solved={solved}
              tappable={step.scaffold !== 'type'}
              highlightCommon={step.scaffold === 'show'}
              onTap={evaluate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal / hint buttons */}
      {!showTracks && step.scaffold === 'reveal' && (
        <Button variant="ghost" fullWidth onClick={() => setRevealed(true)}>
          👀 Ver los saltos
        </Button>
      )}
      {!showTracks && step.scaffold === 'type' && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="self-center text-sm px-3 py-1.5 rounded-full cursor-pointer transition-colors"
          style={{ color: 'var(--color-gold)', background: 'color-mix(in srgb, var(--color-gold) 12%, transparent)' }}
        >
          💡 Pista: ver los saltos
        </button>
      )}

      {/* Type input */}
      {step.scaffold === 'type' && !solved && (
        <NumericInput onConfirm={handleType} resetKey={stepIndex} />
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
          {stepIndex + 1 >= total ? 'Terminar' : 'Siguiente →'}
        </Button>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
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

function Token({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={strong ? 'text-4xl text-white' : 'text-3xl text-white/35'}
      style={{ fontFamily: 'var(--font-display), system-ui' }}
    >
      {children}
    </span>
  );
}

function Track({
  label,
  color,
  values,
  step,
  solved,
  tappable,
  highlightCommon,
  onTap,
}: {
  label: string;
  color: string;
  values: number[];
  step: LessonStep;
  solved: boolean;
  tappable: boolean;
  highlightCommon: boolean;
  onTap: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => {
          const isCommon = v % step.a === 0 && v % step.b === 0;
          const isAnswer = v === step.lcm;
          const ring =
            solved && isAnswer
              ? 'var(--color-gold)'
              : highlightCommon && isCommon
                ? 'color-mix(in srgb, var(--color-gold) 60%, transparent)'
                : 'transparent';
          return (
            <motion.button
              key={v}
              type="button"
              whileTap={tappable && !solved ? { scale: 0.9 } : undefined}
              onClick={tappable ? () => onTap(v) : undefined}
              disabled={!tappable || solved}
              className="min-w-9 h-9 px-2 rounded-lg text-base leading-none flex items-center justify-center"
              style={{
                fontFamily: 'var(--font-display), system-ui',
                background:
                  solved && isAnswer
                    ? 'color-mix(in srgb, var(--color-gold) 25%, var(--color-panel))'
                    : 'var(--color-panel)',
                color: solved && isAnswer ? 'var(--color-gold)' : '#fff',
                border: `2px solid ${ring}`,
                cursor: tappable && !solved ? 'pointer' : 'default',
              }}
            >
              {v}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function MiniTrack({
  label,
  emoji,
  values,
  meet,
  color,
}: {
  label: string;
  emoji: string;
  values: number[];
  meet: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] w-16 text-right shrink-0" style={{ color }}>
        {emoji} {label}
      </span>
      <div className="flex gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center"
            style={{
              fontFamily: 'var(--font-display), system-ui',
              background: v === meet ? 'color-mix(in srgb, var(--color-gold) 22%, var(--color-panel))' : 'var(--color-panel)',
              color: v === meet ? 'var(--color-gold)' : '#fff',
              border: `2px solid ${v === meet ? 'var(--color-gold)' : 'transparent'}`,
            }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
