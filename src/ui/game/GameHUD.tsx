/**
 * GameHUD — top status bar shown during a game round.
 *
 * Shows: lives, streak badge, in-round score, and an animated timer bar.
 * The timer bar changes color as time runs out:
 *   > 50% → lime  |  > 25% → gold  |  ≤ 25% → red
 */

'use client';

import { useGameStore } from '@/state';
import { LivesRow, StreakBadge, CoinBadge } from '@/ui/shared';

interface GameHUDProps {
  maxTimeMs: number;
}

export function GameHUD({ maxTimeMs }: GameHUDProps) {
  const lives = useGameStore((s) => s.lives);
  const streak = useGameStore((s) => s.streak);
  const score = useGameStore((s) => s.score);
  const timeLeft = useGameStore((s) => s.timeLeft);

  const pct =
    timeLeft !== null && maxTimeMs > 0
      ? Math.max(0, Math.min(100, (timeLeft / maxTimeMs) * 100))
      : null;

  const timerColor =
    pct === null
      ? 'var(--color-lime)'
      : pct > 50
        ? 'var(--color-lime)'
        : pct > 25
          ? 'var(--color-gold)'
          : 'var(--color-red-glow)';

  return (
    <div className="flex flex-col gap-2">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <LivesRow lives={lives} />
        <StreakBadge streak={streak} />
        <CoinBadge coins={score} showDelta />
      </div>

      {/* Timer / level bar */}
      {pct !== null && (
        <div
          className="h-3 rounded-full overflow-hidden border border-white/10"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          role="progressbar"
          aria-label="Tiempo restante"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, color-mix(in srgb, ${timerColor} 70%, #000), ${timerColor})`,
              boxShadow: `0 0 10px -1px ${timerColor}`,
              transition: 'width 0.1s linear, background 0.3s ease',
            }}
          />
        </div>
      )}
    </div>
  );
}
