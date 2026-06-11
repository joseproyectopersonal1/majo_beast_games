/**
 * GameScreen — the core game loop for "reto-reloj" mode.
 *
 * State machine (local `phase`):
 *   'loading'  → start-up, boots the game store
 *   'question' → waiting for user input; timer running
 *   'feedback' → brief flash after answer (700ms), input locked
 *   'finished' → game over (lives=0) or completed (N questions done)
 *
 * v2 additions (T02):
 * - Reads activeEffects from useGameStore (shield, freeze, hint, coinMultiplier).
 * - Shows freeze button and hint button when available.
 * - Calls useStreaksStore.applyAnswer() per answer.
 * - Calls useRecordsStore.updateAfterRound() at round end.
 * - Shows celebration if a new streak record was set.
 *
 * Constants (reto-reloj):
 *   TIME_PER_Q  = 12s per question (+ extraTimeMs from effects)
 *   TOTAL_Q     = 10 questions per round (one per ladder rung)
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
import type { ActiveEffects } from '@/domain/shop/effects';
import { PromptDisplay } from './PromptDisplay';
import { NumericInput } from './NumericInput';
import { GameHUD } from './GameHUD';
import { FeedbackFlash, PrizeLadder, Button, LivesRow, Modal } from '@/ui/shared';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const TIME_PER_Q_MS = 12_000;
const TOTAL_Q = 10;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Phase = 'loading' | 'question' | 'feedback' | 'finished';
type FinishReason = 'gameover' | 'completed';

/* ------------------------------------------------------------------ */
/* GameScreen                                                          */
/* ------------------------------------------------------------------ */

interface GameScreenProps {
  moduleId: ModuleId;
  items: readonly Item[];
  effects?: ActiveEffects;
}

export function GameScreen({ moduleId, items, effects }: GameScreenProps) {
  const router = useRouter();

  /* Game store selectors */
  const gameStatus = useGameStore((s) => s.status);
  const currentItem = useGameStore((s) => s.currentItem);
  const lives = useGameStore((s) => s.lives);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const activeEffects = useGameStore((s) => s.activeEffects);
  const freezeUsed = useGameStore((s) => s.freezeUsed);
  const startGame = useGameStore((s) => s.startGame);
  const answerAction = useGameStore((s) => s.answer);
  const setCurrentItem = useGameStore((s) => s.setCurrentItem);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const freezeTimerAction = useGameStore((s) => s.freezeTimer);
  const useHintAction = useGameStore((s) => s.useHint);
  const endGame = useGameStore((s) => s.endGame);
  const reset = useGameStore((s) => s.reset);

  /* Progress store actions */
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const addCoins = useProgressStore((s) => s.addCoins);

  /* Streaks and records */
  const applyAnswerStreak = useStreaksStore((s) => s.applyAnswer);
  const updateAfterRound = useRecordsStore((s) => s.updateAfterRound);
  const bestAnswerStreak = useStreaksStore((s) => s.bestAnswerStreak);
  const checkAndUnlock = useAchievementsStore((s) => s.checkAndUnlock);

  /* Local state machine */
  const [phase, setPhase] = useState<Phase>('loading');
  const [flash, setFlash] = useState<'correct' | 'wrong' | 'idle'>('idle');
  const [finishReason, setFinishReason] = useState<FinishReason>('completed');
  const [questionCount, setQuestionCount] = useState(0);
  const [showLadder, setShowLadder] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [roundAnswered, setRoundAnswered] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [newStreakRecord, setNewStreakRecord] = useState(false);
  const [masteryBonusCount, setMasteryBonusCount] = useState(0);
  const [spinEarned, setSpinEarned] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  /* Refs to avoid stale closures in timeout callbacks */
  const phaseRef = useRef<Phase>('loading');
  phaseRef.current = phase;
  const bestStreakRef = useRef(bestAnswerStreak);
  bestStreakRef.current = bestAnswerStreak;

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

    // T04 §A.3 — remember the last played module for the /jugar shortcut.
    void useSettingsStore.getState().setLastPlayedModule(moduleId);

    // T04 §B.4 — consume a pending x2 prize from the roulette: it doubles
    // this round's coins. If a doble-monedas powerup is also active the
    // multiplier stays 2 (no stacking).
    void useRouletteStore.getState().consumePendingX2().then((hadX2) => {
      if (cancelled) return;
      const baseEffects = effects ?? {
        hintsAvailable: 0, freezeAvailable: false, extraTimeMs: 0,
        extraLives: 0, shieldActive: false, coinMultiplier: 1 as const,
      };
      const merged = hadX2
        ? { ...baseEffects, coinMultiplier: 2 as const }
        : baseEffects;
      startGame({
        moduleId,
        gameMode: 'reto-reloj',
        items,
        firstItem: first,
        lives: 3,
        timeLimitMs: TIME_PER_Q_MS,
        effects: merged,
      });
      setPhase('question');
    });

    return () => {
      cancelled = true;
      reset();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Timer tick (only during 'question' phase) ─────────────────── */
  useEffect(() => {
    if (phase !== 'question') return;
    const id = setInterval(() => tickTimer(100), 100);
    return () => clearInterval(id);
  }, [phase, tickTimer]);

  /* ── Detect timeout ────────────────────────────────────────────── */
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
    const coinMultiplier = useGameStore.getState().activeEffects.coinMultiplier;

    // Apply coin multiplier bonus (doble-monedas adds the EXTRA half).
    if (coinMultiplier > 1) {
      await addCoins(roundScore); // already added per-answer; this doubles it
    }

    // T04 §B.1 — a round with ≥8/10 correct earns a roulette spin (cap 3).
    if (finalCorrect >= 8) {
      await useRouletteStore.getState().grantSpinForRound();
      setSpinEarned(true);
    }

    await updateAfterRound({
      moduleId,
      gameMode: 'reto-reloj',
      roundScore: roundScore * coinMultiplier,
      maxRung,
      roundAnswered: finalCount,
      roundCorrect: finalCorrect,
    });

    // T05: check achievements after round.
    void checkAndUnlock();
  }

  function advance(nextCount: number, nextCorrect: number) {
    if (nextCount >= TOTAL_Q) {
      void finishRound('completed', nextCount, nextCorrect);
      return;
    }
    const next = pickNext();
    if (next) setCurrentItem(next);
    useGameStore.setState({ timeLeft: TIME_PER_Q_MS + activeEffects.extraTimeMs });
    setQuestionCount(nextCount);
    setShowHint(false);
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
      const { correct, shieldAbsorbed } = answerAction(
        { type: 'numeric', value },
        leitnerState,
        Date.now(),
      );

      setRoundAnswered((n) => n + 1);
      if (correct) setRoundCorrect((n) => n + 1);

      // Record answer in progress store (may trigger mastery bonus).
      void recordAnswer(item.id, moduleId, correct, Date.now()).then(({ masteryBonusAwarded }) => {
        if (masteryBonusAwarded) {
          setMasteryBonusCount((n) => n + 1);
          audioManager.play('prize');
        }
      });

      // Update streaks — skip if shield absorbed the hit (player didn't truly fail).
      if (!shieldAbsorbed) {
        const prevBest = bestStreakRef.current;
        void applyAnswerStreak(correct, moduleId).then((newStreaksState) => {
          if (newStreaksState.bestAnswerStreak > prevBest) {
            setNewStreakRecord(true);
          }
        });
      }

      if (correct) {
        const coinMultiplier = useGameStore.getState().activeEffects.coinMultiplier;
        void addCoins(coinsForCorrect(oldRung) * coinMultiplier);
        audioManager.play('correct');
        setTimeout(() => audioManager.play('ladder-up'), 150);
        setFlash('correct');
        setPhase('feedback');
        setTimeout(() => {
          setFlash('idle');
          const newCount = questionCount + 1;
          const newCorrect = roundCorrect + 1;
          advance(newCount, newCorrect);
        }, 700);
      } else if (shieldAbsorbed) {
        // Shield absorbed: show wrong flash but don't lose life / break streak.
        audioManager.play('wrong');
        setFlash('wrong');
        setPhase('feedback');
        setTimeout(() => {
          setFlash('idle');
          const newCount = questionCount + 1;
          advance(newCount, roundCorrect);
        }, 700);
      } else {
        handleWrong(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phaseRef, answerAction, recordAnswer, addCoins, applyAnswerStreak, moduleId, questionCount, roundCorrect, activeEffects],
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
      // Timeout: decrement lives without going through full answer flow.
      useGameStore.setState((s) => ({ lives: Math.max(0, s.lives - 1) }));
      setRoundAnswered((n) => n + 1);
    }

    audioManager.play('wrong');
    setFlash('wrong');
    setPhase('feedback');

    setTimeout(() => {
      setFlash('idle');
      const newLives = useGameStore.getState().lives;
      if (newLives <= 0) {
        const nextCount = questionCount + 1;
        void finishRound('gameover', nextCount, roundCorrect);
        return;
      }
      const newCount = questionCount + 1;
      advance(newCount, roundCorrect);
    }, 700);
  }

  function handleFreeze() {
    if (!freezeTimerAction()) return;
    audioManager.play('correct');
  }

  function handleHint() {
    if (!useHintAction()) return;
    setShowHint(true);
  }

  /* ── Render ────────────────────────────────────────────────────── */

  if (phase === 'loading' || gameStatus === 'idle') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full border-4 border-white/10 border-t-(--color-gold) animate-spin"
          aria-label="Cargando"
        />
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <FinishedScreen
        reason={finishReason}
        newStreakRecord={newStreakRecord}
        masteryBonusCount={masteryBonusCount}
        spinEarned={spinEarned}
        onReplay={() => {
          router.refresh();
        }}
        onHome={() => router.back()}
      />
    );
  }

  return (
    <motion.div
      className="min-h-full flex flex-col px-5 pt-4 pb-6 gap-4 max-w-sm mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* HUD */}
      <GameHUD maxTimeMs={TIME_PER_Q_MS + activeEffects.extraTimeMs} />

      {/* Progress pill */}
      <div className="flex items-center justify-between text-xs text-white/30">
        <span className="flex items-center gap-3">
          {/* A.4 — explicit exit with confirmation (the BeastNav is hidden mid-round) */}
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
        <div className="flex items-center gap-2">
          {/* Freeze button */}
          {activeEffects.freezeAvailable && !freezeUsed && (
            <button
              type="button"
              onClick={handleFreeze}
              className="text-lg hover:opacity-70 transition-opacity cursor-pointer"
              aria-label="Congelar tiempo (+10s)"
              title="🧊 Congelar tiempo"
            >
              🧊
            </button>
          )}
          {/* Hint button */}
          {activeEffects.hintsAvailable > 0 && !showHint && (
            <button
              type="button"
              onClick={handleHint}
              className="text-lg hover:opacity-70 transition-opacity cursor-pointer"
              aria-label={`Usar pista (${activeEffects.hintsAvailable} disponibles)`}
              title={`💡 Pista (${activeEffects.hintsAvailable} disponibles)`}
            >
              💡
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLadder((v) => !v)}
            className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            aria-label="Ver escalera de premios"
          >
            🏆 Escalera
          </button>
        </div>
      </div>

      {/* Shield indicator */}
      {activeEffects.shieldActive && !useGameStore.getState().shieldConsumed && (
        <div className="text-center text-xs" style={{ color: 'var(--color-gold)' }}>
          🛡️ Escudo activo
        </div>
      )}

      {/* Prize ladder (toggleable) */}
      {showLadder && (
        <div
          className="rounded-2xl p-3 border border-white/10"
          style={{ background: 'var(--color-panel)' }}
        >
          <PrizeLadder
            currentRung={useGameStore.getState().rung}
            compact
          />
        </div>
      )}

      {/* Prompt */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {currentItem && <PromptDisplay prompt={currentItem.prompt} />}

        {/* Hint display */}
        <AnimatePresence>
          {showHint && currentItem && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-xs rounded-xl p-3 border border-white/10 text-center"
              style={{ background: 'color-mix(in srgb, var(--color-gold) 8%, var(--color-panel))' }}
            >
              <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">💡 Pista</p>
              <p className="text-sm text-white/70">{currentItem.feedbackTemplateId}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Numeric input */}
      <NumericInput
        onConfirm={handleAnswer}
        disabled={phase !== 'question'}
      />

      {/* Feedback overlay */}
      <FeedbackFlash state={flash} />

      {/* A.4 — exit confirmation modal */}
      <Modal open={confirmExit} onClose={() => setConfirmExit(false)} title="¿Seguro?">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--color-ink-dim)' }}>
            Perderás esta ronda.
          </p>
          <Button fullWidth onClick={() => setConfirmExit(false)}>
            Seguir jugando
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
/* FinishedScreen                                                      */
/* ------------------------------------------------------------------ */

function FinishedScreen({
  reason,
  newStreakRecord,
  masteryBonusCount,
  spinEarned,
  onReplay,
  onHome,
}: {
  reason: FinishReason;
  newStreakRecord: boolean;
  masteryBonusCount: number;
  spinEarned: boolean;
  onReplay: () => void;
  onHome: () => void;
}) {
  const rung = useGameStore((s) => s.rung);
  const score = useGameStore((s) => s.score);
  const bestStreak = useGameStore((s) => s.bestStreak);
  const coinMultiplier = useGameStore((s) => s.activeEffects.coinMultiplier);
  const isVictory = reason === 'completed';

  return (
    <motion.div
      className="min-h-full flex flex-col items-center justify-center px-6 gap-6 text-center max-w-sm mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <span className="text-8xl" aria-hidden>
        {isVictory ? '🏆' : '💀'}
      </span>

      <h1
        className="font-[family-name:var(--font-display)] text-4xl uppercase"
        style={{ color: isVictory ? 'var(--color-gold)' : 'var(--color-red-glow)' }}
      >
        {isVictory ? '¡Lo lograste!' : 'Game Over'}
      </h1>

      {/* T04 — earned roulette spin */}
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

      {/* New streak record celebration */}
      {newStreakRecord && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: 'color-mix(in srgb, var(--color-gold) 15%, var(--color-panel))' }}
        >
          <span className="text-xl">⚡</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-gold)' }}>
            ¡Nueva mejor racha!
          </span>
        </motion.div>
      )}

      {/* Mastery bonus */}
      {masteryBonusCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: 'color-mix(in srgb, var(--color-lime) 10%, var(--color-panel))' }}
        >
          <span className="text-xl">🎯</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-lime)' }}>
            {masteryBonusCount} debilidad{masteryBonusCount !== 1 ? 'es' : ''} superada{masteryBonusCount !== 1 ? 's' : ''}! +{masteryBonusCount * 500} 🪙
          </span>
        </motion.div>
      )}

      {/* Stats grid */}
      <div
        className="w-full grid grid-cols-3 gap-2 rounded-2xl p-4 border border-white/10"
        style={{ background: 'var(--color-panel)' }}
      >
        <Stat label="Peldaño" value={rung + 1} suffix="/10" />
        <Stat
          label="Monedas"
          value={score * coinMultiplier}
          suffix={coinMultiplier > 1 ? '✨' : ''}
        />
        <Stat label="Racha" value={bestStreak} />
      </div>

      {/* Lives remaining */}
      {!isVictory && (
        <div className="flex flex-col items-center gap-1">
          <LivesRow lives={useGameStore.getState().lives} />
          <p className="text-xs text-white/30">vidas al terminar</p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full">
        <Button fullWidth onClick={onReplay}>
          Jugar de nuevo
        </Button>
        <Button variant="ghost" fullWidth onClick={onHome}>
          Inicio
        </Button>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-[family-name:var(--font-display)] text-3xl leading-none"
        style={{ color: 'var(--color-gold)' }}
      >
        {value}
        {suffix && (
          <span className="text-lg text-white/30">{suffix}</span>
        )}
      </span>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}
