/**
 * TopStatusBar — the recurring "broadcast" chrome from the Stitch mockups:
 * BEAST GAMES logo on the left, a coins pill and a day-streak pill on the
 * right. Shared by the home, shop, roulette and records screens.
 *
 * Reads live values from the progress + streak stores so every screen shows
 * the same balance. An optional `extra` slot hangs more controls (audio,
 * settings) on the right, used by the home header.
 */

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useProgressStore } from '@/state';
import { useStreaksStore } from '@/state/useStreaksStore';
import { BeastLogo } from './BeastLogo';

interface TopStatusBarProps {
  /** Where the logo links to. Defaults to home. */
  logoHref?: string;
  /** Extra controls rendered after the streak pill (e.g. audio, settings). */
  extra?: ReactNode;
}

export function TopStatusBar({ logoHref = '/', extra }: TopStatusBarProps) {
  const coins = useProgressStore((s) => s.prizeLedger.coins);
  const currentDayStreak = useStreaksStore((s) => s.currentDayStreak);

  return (
    <header className="flex items-center justify-between px-4 pt-5 pb-2 gap-2">
      <Link href={logoHref} aria-label="Inicio" className="hover:opacity-80 transition-opacity">
        <BeastLogo size={32} />
      </Link>

      <div className="flex items-center gap-2">
        <span className="beast-pill" aria-label={`${coins} monedas`}>
          <span aria-hidden className="text-base leading-none">🪙</span>
          <span
            className="text-sm leading-none"
            style={{ fontFamily: 'var(--font-display), system-ui', color: 'var(--color-gold)' }}
          >
            {coins.toLocaleString('es')}
          </span>
        </span>

        {currentDayStreak > 0 && (
          <span
            className="beast-pill"
            style={{ borderColor: 'color-mix(in srgb, var(--color-magenta) 45%, transparent)' }}
            aria-label={`Racha de ${currentDayStreak} días`}
          >
            <span aria-hidden className="text-base leading-none">🔥</span>
            <span
              className="text-sm leading-none font-bold whitespace-nowrap"
              style={{ color: 'var(--color-magenta)' }}
            >
              {currentDayStreak} {currentDayStreak === 1 ? 'día' : 'días'}
            </span>
          </span>
        )}

        {extra}
      </div>
    </header>
  );
}
