/**
 * PrizeRevealRoulette — prize reveal modal (T04 §B.5).
 *
 * - Burst entrance (scale 0 → 1.1 → 1), 72px emoji, Anton 32px Spanish copy.
 * - Confetti: normal for coins/powerup/x2; MAX gold level for `bestial`.
 * - Coins fly from the modal toward the header balance (6-8 🪙 particles).
 * - Single button: "¡GENIAL!" — or "¡ACEPTO EL RETO!" for the reto prize.
 */

'use client';

import { motion } from 'framer-motion';
import type { Segment } from '@/domain/roulette/wheel';
import { powerupById, type PowerupId } from '@/domain/shop/powerups';
import { Button } from '@/ui/shared';

function revealCopy(segment: Segment, grantedPowerup: PowerupId | null): string {
  switch (segment.kind) {
    case 'coins':
      return `¡GANASTE ${segment.value} MONEDAS!`;
    case 'bestial':
      return '¡GRAN PREMIO! +1.000 MONEDAS';
    case 'powerup': {
      const name = grantedPowerup ? powerupById(grantedPowerup).name.toUpperCase() : 'VENTAJA';
      return `¡PODER SORPRESA: ${name}!`;
    }
    case 'x2-next':
      return '¡X2 EN TU PRÓXIMA RONDA!';
    case 'reto':
      return '¡RETO SORPRESA!';
  }
}

function revealEmoji(segment: Segment, grantedPowerup: PowerupId | null): string {
  if (segment.kind === 'powerup' && grantedPowerup) {
    return powerupById(grantedPowerup).emoji;
  }
  return segment.emoji;
}

/** Lightweight confetti burst with framer-motion particles (no deps). */
function Confetti({ gold }: { gold: boolean }) {
  const count = gold ? 36 : 18;
  const colors = gold
    ? ['#FFC300', '#FF9500', '#FFF6D8', '#FFD75E']
    : ['#FFC300', '#FF2D78', '#39FF88', '#4DA6FF', '#8B7CFF'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 1.4 + Math.random() * 1.2;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length]!;
        return (
          <motion.span
            key={i}
            className="absolute rounded-sm"
            style={{ left: `${left}%`, top: '-12px', width: size, height: size, background: color }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', rotate: 360 + Math.random() * 360, opacity: [1, 1, 0.6] }}
            transition={{ duration, delay, ease: 'easeIn' }}
          />
        );
      })}
    </div>
  );
}

/** 6-8 coin particles flying from the modal toward the header balance. */
function CoinFly() {
  const coins = 7;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {Array.from({ length: coins }, (_, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl"
          style={{ left: '50%', top: '40%' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: 120 + Math.random() * 60,
            y: -260 - Math.random() * 60,
            opacity: [1, 1, 0],
            scale: 0.6,
          }}
          transition={{ duration: 0.9, delay: 0.25 + i * 0.08, ease: 'easeOut' }}
        >
          🪙
        </motion.span>
      ))}
    </div>
  );
}

interface PrizeRevealRouletteProps {
  segment: Segment;
  grantedPowerup: PowerupId | null;
  /** Non-reto prizes: player acknowledged. */
  onConfirm: () => void;
  /** Reto prize: player accepts the bonus question. */
  onAcceptReto: () => void;
}

export function PrizeRevealRoulette({
  segment,
  grantedPowerup,
  onConfirm,
  onAcceptReto,
}: PrizeRevealRouletteProps) {
  const isReto = segment.kind === 'reto';
  const paysCoins = segment.kind === 'coins' || segment.kind === 'bestial';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,.7)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Premio de la ruleta"
    >
      <Confetti gold={segment.kind === 'bestial'} />
      {paysCoins && <CoinFly />}

      <motion.div
        className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5 text-center border"
        style={{
          background: 'var(--color-panel)',
          borderColor:
            segment.kind === 'bestial' ? 'var(--color-gold)' : 'rgba(255,255,255,.12)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.1, 1], opacity: 1 }}
        transition={{ duration: 0.45, times: [0, 0.7, 1], ease: 'easeOut' }}
      >
        <span className="text-7xl" aria-hidden>
          {revealEmoji(segment, grantedPowerup)}
        </span>

        <h2
          className="uppercase leading-tight"
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: '32px',
            color: segment.kind === 'bestial' ? 'var(--color-gold)' : 'var(--color-ink)',
          }}
        >
          {revealCopy(segment, grantedPowerup)}
        </h2>

        {isReto && (
          <p className="text-sm" style={{ color: 'var(--color-ink-dim)' }}>
            Responde 1 pregunta: si aciertas ganas <b style={{ color: 'var(--color-gold)' }}>+400</b> monedas.
            Si fallas, igual te llevas +50.
          </p>
        )}

        <div className="w-full">
          {isReto ? (
            <Button fullWidth onClick={onAcceptReto}>
              ¡ACEPTO EL RETO!
            </Button>
          ) : (
            <Button fullWidth onClick={onConfirm}>
              ¡GENIAL!
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
