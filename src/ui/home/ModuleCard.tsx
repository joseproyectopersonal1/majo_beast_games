/**
 * IslandNode — a single glowing "island" on the Mapa de Islas Bestial.
 *
 * The whole island links to /modulo/[id]. A floating mastery badge sits on
 * top, and (F24) a pulsing weakness-training pip links to practice when the
 * module has fragile items. The two links are siblings (never nested) so the
 * markup stays valid.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Module } from '@/content/types';
import type { ModuleMastery } from '@/domain/progress/mastery';

/** CSS custom property value for each accent. */
const ACCENT_VAR: Record<string, string> = {
  gold: 'var(--color-gold)',
  magenta: 'var(--color-magenta)',
  lime: 'var(--color-lime)',
  'gold-2': 'var(--color-gold-2)',
};

interface IslandNodeProps {
  module: Module;
  mastery: ModuleMastery;
}

export function IslandNode({ module, mastery }: IslandNodeProps) {
  const accent = ACCENT_VAR[module.accent] ?? ACCENT_VAR['gold']!;
  const pct = mastery.masteryPercent;

  return (
    <div className="relative flex flex-col items-center gap-2 w-[128px]">
      {/* Mastery badge */}
      {pct > 0 && (
        <span
          className="absolute -top-3 z-20 px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{
            fontFamily: 'var(--font-display), system-ui',
            background: 'rgba(10,6,24,0.85)',
            color: accent,
            border: `1px solid ${accent}`,
            boxShadow: `0 0 12px -2px ${accent}`,
          }}
        >
          {pct}%
        </span>
      )}

      <Link
        href={`/modulo/${module.id}`}
        aria-label={`Isla ${module.label}, ${pct}% dominado`}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full"
      >
        <motion.div
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="flex items-center justify-center"
          style={{
            width: 96,
            height: 96,
            borderRadius: '42% 58% 56% 44% / 50% 44% 56% 50%',
            background: `radial-gradient(circle at 38% 30%, color-mix(in srgb, ${accent} 38%, #1c1147), #120b2e 78%)`,
            border: `2px solid ${accent}`,
            boxShadow: `0 0 22px -4px ${accent}, inset 0 2px 8px rgba(255,255,255,0.12), 0 10px 22px -10px rgba(0,0,0,0.8)`,
          }}
        >
          <span className="text-4xl leading-none drop-shadow" aria-hidden>
            {module.emoji}
          </span>
        </motion.div>
      </Link>

      <span
        className="uppercase text-center leading-[0.95] text-[13px]"
        style={{
          fontFamily: 'var(--font-display), system-ui',
          color: '#fff',
          textShadow: '0 1px 6px rgba(0,0,0,0.8)',
        }}
      >
        {module.label}
      </span>

      {/* F24 — weakness training pip */}
      {mastery.weakCount > 0 && (
        <Link
          href={`/practicar/${module.id}?weak=1`}
          aria-label={`Entrenar ${mastery.weakCount} debilidades en ${module.label}`}
          className="absolute -right-1 top-8 z-20 flex items-center justify-center w-7 h-7 rounded-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          style={{
            background: 'rgba(10,6,24,0.9)',
            border: '1px solid var(--color-red-glow)',
            boxShadow: '0 0 12px -2px var(--color-red-glow)',
            animation: 'beast-glow-pulse 2s ease-in-out infinite',
          }}
        >
          🎯
        </Link>
      )}
    </div>
  );
}
