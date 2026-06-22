/**
 * HomeHeader — top broadcast bar for the home screen.
 *
 * Uses the shared TopStatusBar (logo + coins + day streak) and hangs the
 * trophy count, audio toggle, and settings link on the right.
 */

'use client';

import Link from 'next/link';
import { useProgressStore } from '@/state';
import { AudioToggle } from '@/ui/shared';
import { TopStatusBar } from '@/ui/brand';

export function HomeHeader() {
  const trophies = useProgressStore((s) => s.prizeLedger.trophies);

  return (
    <TopStatusBar
      extra={
        <>
          {trophies > 0 && (
            <span className="beast-pill" aria-label={`${trophies} trofeos`}>
              <span aria-hidden className="text-base leading-none">🏆</span>
              <span
                className="text-sm leading-none font-bold"
                style={{ color: 'var(--color-gold)' }}
              >
                {trophies}
              </span>
            </span>
          )}
          <AudioToggle />
          <Link
            href="/ajustes"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-lg transition-colors hover:opacity-70 beast-frame"
            aria-label="Ajustes"
          >
            ⚙️
          </Link>
        </>
      }
    />
  );
}
