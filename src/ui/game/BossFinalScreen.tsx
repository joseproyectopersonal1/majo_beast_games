/**
 * BossFinalScreen — "Jefe Final" mode (T05 §F26).
 *
 * Rules:
 *   - 1 life. One mistake = Game Over.
 *   - 8 seconds per question (shorter than reto-reloj's 12s).
 *   - 10 questions (full prize ladder climb).
 *   - Coins × 3 reward.
 *   - No powerups allowed. Pure skill.
 *   - Visual: red pulsing border, screen shake on error.
 *   - Unlocks 'jefe-derrotado' and 'jefe-perfecto' achievements.
 *   - Earns a roulette spin if ≥8/10 correct (same rule as reto-reloj).
 *
 * State machine: same as GameScreen (loading → question → feedback → finished).
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useProgressStore } from '@/state';
import { useStreaksStore } from '@/state/useStreaksStore';
import { useRecordsStore } from '@/state/useRecordsStore';
import { useRouletteStore } from '@/state/useRouletteStore';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAchievementsStore } from '@/state/useAchievementsStore';
import { selectNextItem, initialState } from '@/domain/leitner/engine';
import { coinsForCorrect } from '@/domain/scoring/coins';
import { audioManager } from '@/infra/audio/manager';
import type { Item, ModuleId } from '@/content/types';
import { PromptDisplay } from './PromptDisplay';
import { NumericInput } from './NumericInput';
import { GameHUD } from './GameHUD';
import { FeedbackFlash, PrizeLadder, Button, Modal } from '@/ui/shared';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const TIME_PER_Q_MS = 8_000; // 8 seconds — tighter than reto-reloj's 12s
const TOTAL_Q = 10;
const COIN_MULTIPLIER = 3;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Phase = 'loading' | 'question' | 'feedback' | 'finished';
type FinishReason = 'gameover' | 'completed';

/* ------------------------------------------------------------------ */
/* BossFinalScreen                                                     */
/* ------------------------------------------------------------------ */

interface BossFinalScreenProps {
  moduleId: ModuleId;
  items: readonly Item[];
}

export function BossFinalScreen({ moduleId, items }: BossFinalScreenProps) {
  const router = useRouter();

  /* Game store */
  const gameStatus = useGameStore((s) => s.status);
  const currentItem = useGameStore((s) => s.currentItem);
  const lives = useGameStore((s) => s.lives);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const startGame = useGameStore((s) => s.startGame);
  const answerAction = useGameStore((s) => s.answer);
  const setCurrentItem = useGameStore((s) => s.setCurrentItem);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const endGame = useGameStore((s) => s.endGame);
  const reset = useGameStore((s) => s.reset);

  /* Progress */
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const addCoins = useProgressStore((s) => s.addCoins);
  const applyAnswerStreak = useStreaksStore((s) => s.applyAnswer);
  const updateAfterRound = useRecordsStore((s) => s.updateAfterRound);
  const signalBossComplete = useAchievementsStore((s) => s.signalBossComplete);
  const checkAndUnlock = useAchievementsStore((s) => s.checkAndUnlock);

  /* Local state */
  const [phase, setPhase] = useState<Phase>('loading');
  const [flash, setFlash] = useState<'correct' | 'wrong' | 'idle'>('idle');
  const [finishReason, setFinishReason] = useState<FinishReason>('completed');
  const [questionCount, setQuestionCount] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundAnswered, setRoundAnswered] = useState(0);
  const [showLadder, setShowLadder] = useState(false);
  const [spinEarned, setSpinEarned] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

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
        gameMode: 'jefe-final',
        items,
        firstItem: first,
        lives: 1, // ONE life only
        timeLimitMs: TIME_PER_Q_MS,
        // No effects — boss mode is pure
      });
      setPhase('question');
    }

    return () => {
      cancelled = true;
      reset();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Timer tick ─────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'question') return;
    const id = setInterval(() => tickTimer(100), 100);
    return () => clearInterval(id);
  }, [phase, tickTimer]);

  /* ── Timeout ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase === 'question' && timeLeft === 0) {
      handleWrong(true);
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helpers ───────────────────────────────────────────────────── */

  function pickNext(): Item | undefined {
    const statesByItem = useProgressStore.getState().statesByItem;
    const moduleStates = Object.values(statesByItem).filter((s) =>
      s.itemId.startsWith(moduleId + '.'),
    );
    return selectNextItem(moduleStates, items) ?? items[0];
  }

  async function finishRound(reason: FinishReason, finalCount: number, finalCorrect: number) {
    setFinishReason(reason);
    setPhase('finished');
    endGame();
    audioManager.play(reason === 'completed' ? 'victory' : 'gameover');

    const roundScore = useGameStore.getState().score;
    const maxRung = useGameStore.getState().rung;

    // Boss mode: coins × 3
    const totalCoins = roundScore * COIN_MULTIPLIER;
    await addCoins(totalCoins - roundScore); // Add the extra 2x

    // Roulette spin for ≥8 correct
    if (finalCorrect >= 8) {
      await useRouletteStore.getState().grantSpinForRound();
      setSpinEarned(true);
    }

    // Signal boss completion for achievements
    if (reason === 'completed') {
      signalBossComplete(finalCorrect === TOTAL_Q);
    }

    await updateAfterRound({
      moduleId,
      gameMode: 'jefe-final',
      roundScore: totalCoins,
      maxRung,
      roundAnswered: finalCount,
      roundCorrect: finalCorrect,
    });

    // Check achievements
    void checkAndUnlock();
  }

  function advance(nextCount: number, nextCorrect: number) {
    if (nextCount >= TOTAL_Q) {
      void finishRound('completed', nextCount, nextCorrect);
      return;
    }
    const next = pickNext();
    if (next) setCurrentItem(next);
    useGameStore.setState({ timeLeft: TIME_PER_Q_MS });
    setQuestionCount(nextCount);
    setPhase('question');
  }

  const handleAnswer = useCallback(
    (value: number) => {
      if (phaseRef.current !== 'question') return;
      const item = useGameStore.getState().currentItem;
      if (!item) return;

      const statesByItem = useProgressStore.getState().statesByItem;
      const leitnerState = statesByItem[item.id] ?? initialState(item.id);
      const oldRung = useGameStore.getState().rung;
      const { correct } = answerAction(
        { type: 'numeric', value },
        leitnerState,
        Date.now(),
      );

      setRoundAnswered((n) => n + 1);
      if (correct) setRoundCorrect((n) => n + 1);

      void recordAnswer(item.id, moduleId, correct, Date.now());
      void applyAnswerStreak(correct, moduleId);

      if (correct) {
        void addCoins(coinsForCorrect(oldRung));
        audioManager.play('correct');
        setTimeout(() => audioManager.play('ladder-up'), 150);
        setFlash('correct');
        setPhase('feedback');
        setTimeout(() => {
          setFlash('idle');
          advance(questionCount + 1, roundCorrect + 1);
        }, 700);
      } else {
        handleWrong(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answerAction, recordAnswer, addCoins, applyAnswerStreak, moduleId, questionCount, roundCorrect],
  );

  function handleWrong(isTimeout: boolean) {
    if (phaseRef.current !== 'question') return;

    if (!isTimeout) {
      const item = useGameStore.getState().currentItem;
      if (item) {
        const statesByItem = useProgressStore.getState().statesByItem;
        const leitnerState = statesByItem[item.id] ?? initialState(item.id);
        answerAction({ type: 'numeric', value: -1 }, leitnerState, Date.now());
        void recordAnswer(item.id, moduleId, false, Date.now());
        void applyAnswerStreak(false, moduleId);
      }
      setRoundAnswered((n) => n + 1);
    } else {
      useGameStore.setState((s) => ({ lives: Math.max(0, s.lives - 1) }));
      setRoundAnswered((n) => n + 1);
    }

    // Screen shake!
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);

    audioManager.play('wrong');
    setFlash('wrong');
    setPhase('feedback');

    setTimeout(() => {
      setFlash('idle');
      // 1 life means instant game over
      void finishRound('gameover', questionCount + 1, roundCorrect);
    }, 1000);
  }

  /* ── Render ────────────────────────────────────────────────────── */

  if (phase === 'loading' || gameStatus === 'idle') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full border-4 border-white/10 border-t-(--color-red-glow) animate-spin"
          aria-label="Cargando"
        />
      </div>
    );
  }

  if (phase === 'finished') {
    const isVictory = finishReason === 'completed';
    const totalCoins = useGameStore.getState().score * COIN_MULTIPLIER;
    return (
      <motion.div
        className="min-h-full flex flex-col items-center justify-center px-6 gap-6 text-center max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <span className="text-8xl" aria-hidden>
          {isVictory ? '👊' : '💀'}
        </span>

        <h1
          className="font-[family-name:var(--font-display)] text-4xl uppercase"
          style={{ color: isVictory ? 'var(--color-gold)' : 'var(--color-red-glow)' }}
        >
          {isVictory ? '¡JEFE DERROTADO!' : 'ELIMINADA'}
        </h1>

        {isVictory && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm"
            style={{ color: 'var(--color-gold)' }}
          >
            ¡Monedas ×{COIN_MULTIPLIER}! 🪙 {totalCoins.toLocaleString()}
          </motion.p>
        )}

        {spinEarned && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'color-mix(in srgb, var(--color-magenta) 15%, var(--color-panel))' }}
          >
            <span className="text-xl">🎡</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-magenta)' }}>
              ¡Ganaste un giro de ruleta!
            </span>
          </motion.div>
        )}

        {/* Stats */}
        <div className="beast-frame w-full grid grid-cols-3 gap-2 p-4">
          <BossStat label="Pregunta" value={`${roundAnswered}/${TOTAL_Q}`} />
          <BossStat label="Correctas" value={roundCorrect} />
          <BossStat label="Monedas" value={totalCoins} suffix="×3" />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button fullWidth onClick={() => window.location.reload()}>
            Intentar de nuevo
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
      animate={screenShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { opacity: 1 }}
      transition={screenShake ? { duration: 0.4 } : { duration: 0.2 }}
      style={{
        borderLeft: '3px solid var(--color-red-glow)',
        borderRight: '3px solid var(--color-red-glow)',
      }}
    >
      {/* Red pulsing indicator at top */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{ background: 'var(--color-red-glow)' }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* HUD */}
      <GameHUD maxTimeMs={TIME_PER_Q_MS} />

      {/* Header */}
      <div className="flex items-center justify-between text-xs text-white/30">
        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmExit(true)}
            className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            aria-label="Salir de la ronda"
          >
            ✕ Salir
          </button>
          {questionCount + 1} / {TOTAL_Q}
        </span>
        <span className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-red-glow)', color: 'white', fontSize: '10px' }}
          >
            👊 JEFE FINAL
          </span>
          <button
            type="button"
            onClick={() => setShowLadder((v) => !v)}
            className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            aria-label="Ver escalera"
          >
            🏆 Escalera
          </button>
        </span>
      </div>

      {/* Prize ladder */}
      {showLadder && (
        <div
          className="rounded-2xl p-3 border border-white/10"
          style={{ background: 'var(--color-panel)' }}
        >
          <PrizeLadder currentRung={useGameStore.getState().rung} compact />
        </div>
      )}

      {/* Prompt */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {currentItem && <PromptDisplay prompt={currentItem.prompt} />}
      </div>

      {/* Input */}
      <NumericInput
        onConfirm={handleAnswer}
        disabled={phase !== 'question'}
        resetKey={currentItem?.id ?? questionCount}
      />

      {/* Feedback */}
      <FeedbackFlash state={flash} />

      {/* Exit confirmation */}
      <Modal open={confirmExit} onClose={() => setConfirmExit(false)} title="¿Seguro?">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--color-ink-dim)' }}>
            Perderás esta ronda del Jefe Final.
          </p>
          <Button fullWidth onClick={() => setConfirmExit(false)}>
            Seguir luchando
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              reset();
              router.back();
            }}
          >
            Salir
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function BossStat({
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
        style={{ color: 'var(--color-red-glow)' }}
      >
        {value}
        {suffix && <span className="text-sm text-white/40 ml-1">{suffix}</span>}
      </span>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}
