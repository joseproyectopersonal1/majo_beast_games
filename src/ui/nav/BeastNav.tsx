/**
 * BeastNav — global fixed bottom navigation bar (T04 §A).
 *
 * 5 equal-width tabs: Inicio, Jugar, Ruleta, Tienda, Récords.
 * - Always visible on main screens; HIDDEN during an active game round
 *   (useGameStore.status === 'playing' | 'paused') to prevent accidental exits.
 * - Roulette tab shows a pulsing badge when ≥1 spin is available.
 * - Active tab: gold icon+label with a 4px dot; inactive: ink-dim.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/state/useGameStore';
import { useRouletteStore } from '@/state/useRouletteStore';
import { audioManager } from '@/infra/audio/manager';

type NavItem = {
  href: string;
  emoji: string;
  label: string;
  /** Marks active when pathname starts with any of these prefixes. */
  match: string[];
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', emoji: '🏠', label: 'Inicio', match: ['/'] },
  { href: '/jugar', emoji: '🎮', label: 'Jugar', match: ['/jugar', '/modulo', '/practicar', '/aprender'] },
  { href: '/ruleta', emoji: '🎡', label: 'Ruleta', match: ['/ruleta'] },
  { href: '/tienda', emoji: '🛒', label: 'Tienda', match: ['/tienda'] },
  { href: '/records', emoji: '🏆', label: 'Récords', match: ['/records'] },
];

function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === '/') return pathname === '/';
  return item.match.some((m) => pathname === m || pathname.startsWith(m + '/'));
}

export function BeastNav() {
  const pathname = usePathname();
  const gameStatus = useGameStore((s) => s.status);
  // Subscribe to the underlying fields so the badge re-renders reactively.
  const lastFreeSpinDay = useRouletteStore((s) => s.lastFreeSpinDay);
  const earnedSpins = useRouletteStore((s) => s.earnedSpins);
  const rouletteLoaded = useRouletteStore((s) => s.loaded);
  const availableSpins = useRouletteStore((s) => s.availableSpins);

  // A.4 — hidden during an active round to avoid accidental mid-game exits.
  if (gameStatus === 'playing' || gameStatus === 'paused') return null;

  // Recompute on every render; depends on lastFreeSpinDay/earnedSpins above.
  void lastFreeSpinDay;
  void earnedSpins;
  const spins = rouletteLoaded ? availableSpins() : 0;

  return (
    <>
    {/* In-flow spacer so page content never hides behind the fixed bar. */}
    <div aria-hidden style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px))' }} />
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--color-panel)',
        borderTop: '1px solid rgba(255,255,255,.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item, pathname);
        const color = active ? 'var(--color-gold)' : 'var(--color-ink-dim)';
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            onClick={() => audioManager.play('correct')}
          >
            <motion.div
              whileTap={{ scale: 0.92 }}
              className="h-16 flex flex-col items-center justify-center gap-0.5 relative"
            >
              <span className="relative text-xl leading-none" aria-hidden>
                {item.emoji}
                {/* A.3 — roulette badge when spins available */}
                {item.href === '/ruleta' && spins > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full"
                    style={{ background: 'var(--color-magenta)' }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    aria-label={`${spins} giros disponibles`}
                  />
                )}
              </span>
              <span
                className="text-[12px] font-semibold leading-none"
                style={{ color, fontFamily: 'var(--font-body)' }}
              >
                {item.label}
              </span>
              {active && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: 'var(--color-gold)' }}
                  aria-hidden
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
    </>
  );
}
