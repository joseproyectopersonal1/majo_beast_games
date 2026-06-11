/**
 * HomeHeader — sticky top bar for the home screen.
 *
 * Shows the app title, coins from the prize ledger, trophy count (if any),
 * day streak chip, the audio toggle, and navigation buttons for the shop
 * and records hall.
 */

'use client';

import Link from 'next/link';
import { useProgressStore } from '@/state';
import { useStreaksStore } from '@/state/useStreaksStore';
import { CoinBadge, AudioToggle } from '@/ui/shared';

export function HomeHeader() {
  const coins = useProgressStore((s) => s.prizeLedger.coins);
  const trophies = useProgressStore((s) => s.prizeLedger.trophies);
  const currentDayStreak = useStreaksStore((s) => s.currentDayStreak);

  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-3 gap-2">
      {/* Title */}
      <div className="flex flex-col leading-none">
        <h1
          className="font-[family-name:var(--font-display)] text-4xl uppercase"
          style={{
            background: 'linear-gradient(180deg,#ffffff,var(--color-gold))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Beast Games
        </h1>
        <div className="flex items-center gap-2 mt-0.5">
          {trophies > 0 && (
            <span className="text-xs text-(--color-gold)/60 font-semibold">
              🏆 {trophies} {trophies === 1 ? 'trofeo' : 'trofeos'}
            </span>
          )}
          {currentDayStreak > 0 && (
            <span
              className="text-xs font-bold"
              style={{ color: 'var(--color-gold)' }}
              aria-label={`Racha de ${currentDayStreak} días`}
            >
              🔥 {currentDayStreak} {currentDayStreak === 1 ? 'día' : 'días'}
            </span>
          )}
        </div>
      </div>

      {/* Right controls — Tienda/Récords viven en la BeastNav (T04 §A);
          aquí solo saldo, audio y Ajustes (§A.5). */}
      <div className="flex items-center gap-2">
        <CoinBadge coins={coins} />
        <AudioToggle />
        <Link
          href="/ajustes"
          className="flex items-center justify-center w-12 h-12 rounded-xl text-xl transition-colors hover:opacity-70"
          style={{ background: 'var(--color-panel)' }}
          aria-label="Ajustes"
        >
          ⚙️
        </Link>
      </div>
    </header>
  );
}
