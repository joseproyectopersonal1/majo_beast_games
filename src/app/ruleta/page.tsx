/**
 * /ruleta — Ruleta Bestial (T04 §B.5).
 *
 * Flow: idle → spinning (3.5s, lands on the pre-decided segment) → reveal
 *       → [reto: bonus question → retoResult] → idle.
 *
 * CRITICAL: the outcome is decided AND persisted before the animation starts
 * (decide → persist → animate). If the page reloads mid-spin, the pending
 * prize is shown directly on next visit — never lost, never duplicated.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  useRouletteStore,
  useProgressStore,
  useAchievementsStore,
} from '@/state';
import { SEGMENTS, segmentById, type Segment } from '@/domain/roulette/wheel';
import { recommendedModule } from '@/domain/reinforce/recommend';
import { selectNextItem, initialState } from '@/domain/leitner/engine';
import { getModuleItems } from '@/content/registry';
import { audioManager } from '@/infra/audio/manager';
import { RETO_WIN_COINS, RETO_CONSOLATION_COINS } from '@/state/useRouletteStore';
import type { Item } from '@/content/types';
import { WheelSvg } from '@/ui/roulette/WheelSvg';
import { SpinButton } from '@/ui/roulette/SpinButton';
import { SpinCounter } from '@/ui/roulette/SpinCounter';
import { PrizeRevealRoulette } from '@/ui/roulette/PrizeRevealRoulette';
import { Button, Modal } from '@/ui/shared';
import { TopStatusBar, PageTitle } from '@/ui/brand';
import { PromptDisplay, NumericInput } from '@/ui/game';

const SWEEP = 360 / SEGMENTS.length; // 45°

type Phase = 'idle' | 'spinning' | 'reveal' | 'reto' | 'retoResult';

export default function RuletaPage() {
  const moduleMastery = useProgressStore((s) => s.moduleMastery);
  const lastFreeSpinDay = useRouletteStore((s) => s.lastFreeSpinDay);
  const earnedSpins = useRouletteStore((s) => s.earnedSpins);
  const pendingPrizeId = useRouletteStore((s) => s.pendingPrizeId);
  const lastGrantedPowerup = useRouletteStore((s) => s.lastGrantedPowerup);
  const availableSpins = useRouletteStore((s) => s.availableSpins);
  const spinWheel = useRouletteStore((s) => s.spinWheel);
  const confirmReveal = useRouletteStore((s) => s.confirmReveal);
  const resolveReto = useRouletteStore((s) => s.resolveReto);
  const signalBestial = useAchievementsStore((s) => s.signalBestial);
  const signalRetoComplete = useAchievementsStore((s) => s.signalRetoComplete);
  const checkAndUnlock = useAchievementsStore((s) => s.checkAndUnlock);

  const [phase, setPhase] = useState<Phase>('idle');
  const [rotation, setRotation] = useState(0);
  const [wonSegment, setWonSegment] = useState<Segment | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [retoItem, setRetoItem] = useState<Item | null>(null);
  const [retoCorrect, setRetoCorrect] = useState<boolean | null>(null);

  const tickTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Edge case (B.5): a prize was decided+persisted but never revealed
  // (app closed mid-animation) → show the reveal directly.
  useEffect(() => {
    if (pendingPrizeId && phase === 'idle') {
      setWonSegment(segmentById(pendingPrizeId));
      setPhase('reveal');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrizeId]);

  // availableSpins recomputes against today's local date on each render —
  // a day change while the app is open is picked up on revisit (B.5).
  void lastFreeSpinDay;
  void earnedSpins;
  const spins = availableSpins();

  /* ── Spin ──────────────────────────────────────────────────────── */

  async function handleSpin() {
    if (phase !== 'idle' || spins <= 0) return;
    setPhase('spinning');

    // 1-2. DECIDE + PERSIST (spin consumed, instant award applied, pendingPrize saved).
    const segment = await spinWheel();
    setWonSegment(segment);

    // T05: signal bestial for achievements
    if (segment.kind === 'bestial') {
      signalBestial();
    }

    // 3. ANIMATE: land the winning segment center exactly under the needle (top).
    const index = SEGMENTS.findIndex((s) => s.id === segment.id);
    const centerAngle = index * SWEEP + SWEEP / 2;
    const turns = 4 + Math.floor(Math.random() * 3); // 4-6 full turns
    const current = ((rotation % 360) + 360) % 360;
    const delta = (((360 - centerAngle) - current) + 720) % 360;
    setRotation(rotation + turns * 360 + delta);

    // Ratchet tick-tick decelerating in sync with the 3.5s spin.
    tickTimers.current.forEach(clearTimeout);
    tickTimers.current = [];
    let t = 0;
    let gap = 80;
    while (t < 3300) {
      tickTimers.current.push(
        setTimeout(() => audioManager.play('ladder-up'), t),
      );
      t += gap;
      gap = Math.min(420, gap * 1.18);
    }
  }

  function handleSpinEnd() {
    tickTimers.current.forEach(clearTimeout);
    audioManager.play(wonSegment?.kind === 'bestial' ? 'victory' : 'prize');
    setPhase('reveal');
  }

  /* ── Reveal / reto ─────────────────────────────────────────────── */

  async function handleConfirmReveal() {
    await confirmReveal();
    setWonSegment(null);
    setPhase('idle');
    // T05: check achievements after spin reveal
    void checkAndUnlock();
  }

  function handleAcceptReto() {
    // Bonus question from the recommended module (most fragile, else lowest mastery).
    const moduleId = recommendedModule(moduleMastery);
    const items = getModuleItems(moduleId) ?? [];
    const statesByItem = useProgressStore.getState().statesByItem;
    const moduleStates = Object.values(statesByItem).filter((s) =>
      s.itemId.startsWith(moduleId + '.'),
    );
    const item = selectNextItem(moduleStates, items) ?? items[0] ?? null;
    if (!item) {
      // No content (should not happen): pay the consolation and close.
      void resolveReto(false).then(() => setPhase('idle'));
      return;
    }
    setRetoItem(item);
    setPhase('reto');
  }

  async function handleRetoAnswer(value: number) {
    if (!retoItem) return;
    const correct = retoItem.answer.type === 'numeric' && retoItem.answer.value === value;
    setRetoCorrect(correct);
    audioManager.play(correct ? 'victory' : 'wrong');
    await resolveReto(correct);
    // T05: signal reto completion for achievements
    signalRetoComplete();
    setPhase('retoResult');
  }

  function handleRetoDone() {
    setRetoItem(null);
    setRetoCorrect(null);
    setWonSegment(null);
    setPhase('idle');
    // T05: check achievements after reto
    void checkAndUnlock();
  }

  /* ── Render ────────────────────────────────────────────────────── */

  const dimmed = spins <= 0 && phase === 'idle';

  return (
    <div className="min-h-full flex flex-col max-w-sm mx-auto w-full">
      <TopStatusBar />
      <PageTitle icon="🎡" className="mt-1 mb-3">Ruleta</PageTitle>

      {/* Spin counter */}
      <div className="px-5 mb-4">
        <SpinCounter spins={spins} />
      </div>

      {/* Wheel */}
      <div className="flex-1 flex items-center justify-center px-5 py-2">
        <WheelSvg
          rotation={rotation}
          spinning={phase === 'spinning'}
          dimmed={dimmed}
          onSpinEnd={handleSpinEnd}
        />
      </div>

      {/* Main button */}
      <div className="px-5 mt-4">
        <SpinButton
          state={phase === 'spinning' ? 'spinning' : spins > 0 ? 'available' : 'none'}
          onSpin={handleSpin}
        />
      </div>

      {/* Secondary link (only with spins) */}
      {spins > 0 && (
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="h-12 mx-5 mt-2 mb-4 text-sm cursor-pointer transition-colors hover:text-white"
          style={{ color: 'var(--color-ink-dim)' }}
        >
          ¿Cómo gano más giros?
        </button>
      )}
      {spins <= 0 && <div className="h-6" aria-hidden />}

      {/* Info modal (B.5.5) */}
      <Modal open={showInfo} onClose={() => setShowInfo(false)} title="¿Cómo gano más giros?">
        <div className="flex flex-col gap-4">
          <p className="text-sm flex gap-2">
            <span aria-hidden>🗓️</span>
            <span>Cada día tienes <b style={{ color: 'var(--color-gold)' }}>1 giro gratis</b>.</span>
          </p>
          <p className="text-sm flex gap-2">
            <span aria-hidden>⭐</span>
            <span>Gana una ronda con <b style={{ color: 'var(--color-gold)' }}>8 o más aciertos</b> y te llevas otro.</span>
          </p>
          <Button fullWidth onClick={() => setShowInfo(false)}>
            ¡Entendido!
          </Button>
        </div>
      </Modal>

      {/* Prize reveal */}
      {phase === 'reveal' && wonSegment && (
        <PrizeRevealRoulette
          segment={wonSegment}
          grantedPowerup={lastGrantedPowerup}
          onConfirm={handleConfirmReveal}
          onAcceptReto={handleAcceptReto}
        />
      )}

      {/* Reto bonus question */}
      {phase === 'reto' && retoItem && (
        <div
          className="fixed inset-0 z-50 flex flex-col px-5 pt-8 pb-6 gap-6 max-w-sm mx-auto"
          style={{ background: 'var(--color-bg)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Reto sorpresa"
        >
          <h2
            className="uppercase text-center"
            style={{
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontSize: '26px',
              color: 'var(--color-magenta)',
            }}
          >
            ❓ Reto sorpresa
          </h2>
          <p className="text-center text-sm" style={{ color: 'var(--color-ink-dim)' }}>
            Acierto: <b style={{ color: 'var(--color-gold)' }}>+{RETO_WIN_COINS}</b> · Fallo: +{RETO_CONSOLATION_COINS}
          </p>
          <div className="flex-1 flex items-center justify-center">
            <PromptDisplay prompt={retoItem.prompt} />
          </div>
          <NumericInput onConfirm={handleRetoAnswer} disabled={false} />
        </div>
      )}

      {/* Reto result */}
      {phase === 'retoResult' && retoCorrect !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,.7)' }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5 text-center border border-white/10"
            style={{ background: 'var(--color-panel)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.1, 1], opacity: 1 }}
            transition={{ duration: 0.45, times: [0, 0.7, 1], ease: 'easeOut' }}
          >
            <span className="text-7xl" aria-hidden>{retoCorrect ? '🏆' : '💪'}</span>
            <h2
              className="uppercase"
              style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: '32px',
                color: retoCorrect ? 'var(--color-gold)' : 'var(--color-ink)',
              }}
            >
              {retoCorrect
                ? `¡RETO SUPERADO! +${RETO_WIN_COINS}`
                : `¡Buen intento! +${RETO_CONSOLATION_COINS} de consuelo`}
            </h2>
            <Button fullWidth onClick={handleRetoDone}>
              ¡GENIAL!
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
