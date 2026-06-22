/**
 * MemoriaScreen — relaxed Leitner-driven game mode (T05 §F25).
 *
 * Rules:
 *   - No timer, no lives. Pure practice.
 *   - 15 questions per session (Leitner picks).
 *   - Coins: half of reto-reloj (coinsForCorrect(rung) / 2, rounded up).
 *   - Streaks & records tracked normally.
 *   - Roulette spin NOT earned (not competitive enough).
 *
 * State machine:
 *   'loading'  → boot
 *   'question' → waiting for input
 *   'feedback' → 700ms flash
 *   'finished' → summary
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useProgressStore } from '@/state';
import { useStreaksStore } from '@/state/useStreaksStore';
import { useRecordsStore } from '@/state/useRecordsStore';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAchievementsStore } from '@/state/useAchievementsStore';
import { selectNextItem, initialState } from '@/domain/leitner/engine';
import { audioManager } from '@/infra/audio/manager';
import type { Item, ModuleId } from '@/content/types';
import { PromptDisplay } from './PromptDisplay';
import { NumericInput } from './NumericInput';
import { FeedbackFlash, Button } from '@/ui/shared';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const TOTAL_Q = 15;
/** Coins per correct answer in memoria mode: flat 25 per correct. */
const COINS_PER_CORRECT = 25;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Phase = 'loading' | 'question' | 'feedback' | 'finished';

/* ------------------------------------------------------------------ */
/* MemoriaScreen                                                       */
/* ------------------------------------------------------------------ */

interface MemoriaScreenProps {
  moduleId: ModuleId;
  items: readonly Item[];
}

export function MemoriaScreen({ moduleId, items }: MemoriaScreenProps) {
  const router = useRouter();

  /* Stores */
  const startGame = useGameStore((s) => s.startGame);
  const gameStatus = useGameStore((s) => s.status);
  const currentItem = useGameStore((s) => s.currentItem);
  const setCurrentItem = useGameStore((s) => s.setCurrentItem);
  const endGame = useGameStore((s) => s.endGame);
  const reset = useGameStore((s) => s.reset);

  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const addCoins = useProgressStore((s) => s.addCoins);
  const applyAnswerStreak = useStreaksStore((s) => s.applyAnswer);
  const updateAfterRound = useRecordsStore((s) => s.updateAfterRound);
  const checkAndUnlock = useAchievementsStore((s) => s.checkAndUnlock);

  /* Local state */
  const [phase, setPhase] = useState<Phase>('loading');
  const [flash, setFlash] = useState<'correct' | 'wrong' | 'idle'>('idle');
  const [questionCount, setQuestionCount] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundAnswered, setRoundAnswered] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [showAnswer, setShowAnswer] = useState<string | null>(null);

  const phaseRef = useRef<Phase>('loading');
  phaseRef.current = phase;

  /* ── Boot ─────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const statesByItem = useProgressStore.getState().statesByItem;
    const moduleStates = Object.values(statesByItem).filter((s) =>
      s.itemId.startsWith(moduleId + '.'),
    );
    const first = selectNextItem(moduleStates, items) ?? items[0];
    if (!first) {
      router.back();
      return;
    }

    void useSettingsStore.getState().setLastPlayedModule(moduleId);

    if (!cancelled) {
      startGame({
        moduleId,
        gameMode: 'memoria',
        items,
        firstItem: first,
        lives: 999, // Effectively infinite
        // No timer
      });
      setPhase('question');
    }

    return () => {
      cancelled = true;
      reset();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helpers ───────────────────────────────────────────────────── */

  function pickNext(): Item | undefined {
    const statesByItem = useProgressStore.getState().statesByItem;
    const moduleStates = Object.values(statesByItem).filter((s) =>
      s.itemId.startsWith(moduleId + '.'),
    );
    return selectNextItem(moduleStates, items) ?? items[0];
  }

  async function finishRound(finalCorrect: number, finalAnswered: number) {
    setPhase('finished');
    endGame();
    audioManager.play(finalCorrect >= 10 ? 'victory' : 'correct');

    await updateAfterRound({
      moduleId,
      gameMode: 'memoria',
      roundScore: totalCoins,
      maxRung: finalCorrect - 1,
      roundAnswered: finalAnswered,
      roundCorrect: finalCorrect,
    });

    // Check achievements after round
    void checkAndUnlock();
  }

  function advance(nextCount: number) {
    if (nextCount >= TOTAL_Q) {
      void finishRound(roundCorrect, roundAnswered);
      return;
    }
    const next = pickNext();
    if (next) setCurrentItem(next);
    setQuestionCount(nextCount);
    setShowAnswer(null);
    setPhase('question');
  }

  const handleAnswer = useCallback(
    (value: number) => {
      if (phaseRef.current !== 'question') return;
      const item = useGameStore.getState().currentItem;
      if (!item) return;

      const correct = item.answer.type === 'numeric' && item.answer.value === value;
      const expected = item.answer.type === 'numeric' ? String(item.answer.value) : '?';

      // Record in progress store
      void recordAnswer(item.id, moduleId, correct, Date.now());
      void applyAnswerStreak(correct, moduleId);

      const newAnswered = roundAnswered + 1;
      const newCorrect = correct ? roundCorrect + 1 : roundCorrect;
      setRoundAnswered(newAnswered);

      if (correct) {
        void addCoins(COINS_PER_CORRECT);
        setTotalCoins((c) => c + COINS_PER_CORRECT);
        setRoundCorrect(newCorrect);
        audioManager.play('correct');
        setFlash('correct');
        setPhase('feedback');
        setTimeout(() => {
          setFlash('idle');
          advance(questionCount + 1);
        }, 700);
      } else {
        audioManager.play('wrong');
        setFlash('wrong');
        setShowAnswer(expected);
        setPhase('feedback');
        setTimeout(() => {
          setFlash('idle');
          setShowAnswer(null);
          advance(questionCount + 1);
        }, 1500); // Longer delay to show correct answer
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moduleId, questionCount, roundCorrect, roundAnswered],
  );

  /* ── Render ────────────────────────────────────────────────────── */

  if (phase === 'loading' || gameStatus === 'idle') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full border-4 border-white/10 border-t-(--color-magenta) animate-spin"
          aria-label="Cargando"
        />
      </div>
    );
  }

  if (phase === 'finished') {
    const accuracy = roundAnswered > 0 ? Math.round((roundCorrect / roundAnswered) * 100) : 0;
    return (
      <motion.div
        className="min-h-full flex flex-col items-center justify-center px-6 gap-6 text-center max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <span className="text-8xl" aria-hidden>
          {roundCorrect >= 12 ? '🧠' : roundCorrect >= 8 ? '👏' : '📖'}
        </span>

        <h1
          className="font-[family-name:var(--font-display)] text-4xl uppercase"
          style={{ color: 'var(--color-magenta)' }}
        >
          ¡Sesión completada!
        </h1>

        {/* Stats */}
        <div
          className="w-full grid grid-cols-3 gap-2 rounded-2xl p-4 border border-white/10"
          style={{ background: 'var(--color-panel)' }}
        >
          <FinStat label="Correctas" value={`${roundCorrect}/${roundAnswered}`} />
          <FinStat label="Precisión" value={`${accuracy}%`} />
          <FinStat label="Monedas" value={totalCoins} suffix="🪙" />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button fullWidth onClick={() => window.location.reload()}>
            Practicar más
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.back()}>
            Inicio
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-full flex flex-col px-5 pt-4 pb-6 gap-4 max-w-sm mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            reset();
            router.back();
          }}
          className="text-white/30 hover:text-white/60 transition-colors cursor-pointer text-sm"
          aria-label="Salir"
        >
          ✕ Salir
        </button>
        <span
          className="font-[family-name:var(--font-display)] text-lg uppercase"
          style={{ color: 'var(--color-magenta)' }}
        >
          🧠 Memoria
        </span>
        <span className="text-xs text-white/30">
          {questionCount + 1}/{TOTAL_Q}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--color-panel)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--color-magenta)' }}
          animate={{ width: `${((questionCount) / TOTAL_Q) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      </div>

      {/* Prompt */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {currentItem && <PromptDisplay prompt={currentItem.prompt} />}

        {/* Show correct answer on wrong */}
        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl px-6 py-3 border text-center"
              style={{
                background: 'color-mix(in srgb, var(--color-red-glow) 10%, var(--color-panel))',
                borderColor: 'color-mix(in srgb, var(--color-red-glow) 30%, transparent)',
              }}
            >
              <p className="text-xs text-white/40 mb-1">Respuesta correcta:</p>
              <p
                className="font-[family-name:var(--font-display)] text-3xl"
                style={{ color: 'var(--color-gold)' }}
              >
                {showAnswer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Score pills */}
      <div className="flex items-center justify-center gap-4 text-xs text-white/40">
        <span>✅ {roundCorrect}</span>
        <span>❌ {roundAnswered - roundCorrect}</span>
        <span>🪙 {totalCoins}</span>
      </div>

      {/* Numeric input */}
      <NumericInput
        onConfirm={handleAnswer}
        disabled={phase !== 'question'}
        resetKey={currentItem?.id ?? questionCount}
      />

      {/* Feedback overlay */}
      <FeedbackFlash state={flash} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function FinStat({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-[family-name:var(--font-display)] text-2xl leading-none"
        style={{ color: 'var(--color-magenta)' }}
      >
        {value}
        {suffix && <span className="text-sm ml-0.5">{suffix}</span>}
      </span>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}
