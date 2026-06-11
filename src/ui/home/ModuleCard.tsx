/**
 * ModuleCard — tappable card for a single module on the home screen.
 *
 * Shows: emoji, name, mastery bar, and a count summary.
 * Tapping navigates to /modulo/[id] where the player picks a game mode.
 *
 * If the module has weak items, shows an "Entrenar debilidades" button
 * that navigates to /practicar/[id]?weak=1 (F24).
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MasteryBar } from '@/ui/shared';
import type { Module } from '@/content/types';
import type { ModuleMastery } from '@/domain/progress/mastery';

/** CSS custom property value for each accent. */
const ACCENT_VAR: Record<string, string> = {
  gold: 'var(--color-gold)',
  magenta: 'var(--color-magenta)',
  lime: 'var(--color-lime)',
  'gold-2': 'var(--color-gold-2)',
};

interface ModuleCardProps {
  module: Module;
  mastery: ModuleMastery;
}

export function ModuleCard({ module, mastery }: ModuleCardProps) {
  const accentColor = ACCENT_VAR[module.accent] ?? ACCENT_VAR['gold']!;
  const total =
    mastery.masteredCount + mastery.inProgressCount + mastery.weakCount;

  return (
    <div className="flex flex-col gap-1">
      <Link
        href={`/modulo/${module.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl"
      >
        <motion.article
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="flex items-center gap-4 p-4 rounded-2xl border transition-colors duration-150"
          style={{
            background: 'var(--color-panel)',
            borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
          }}
          aria-label={`Módulo ${module.label}, ${mastery.masteryPercent}% dominado`}
        >
          {/* Emoji */}
          <div
            className="flex-none flex items-center justify-center w-14 h-14 rounded-xl text-3xl"
            style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
            aria-hidden
          >
            {module.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <h2
              className="font-[family-name:var(--font-display)] text-xl uppercase leading-none truncate"
            >
              {module.label}
            </h2>

            <MasteryBar
              percent={mastery.masteryPercent}
              accent={module.accent}
            />

            <p className="text-xs text-white/40">
              {total === 0
                ? 'Sin empezar'
                : `${mastery.masteredCount} dominadas · ${mastery.inProgressCount} aprendiendo`}
              {mastery.weakCount > 0
                ? ` · ${mastery.weakCount} frágiles`
                : ''}
            </p>
          </div>

          {/* Arrow */}
          <span
            className="flex-none text-lg opacity-30"
            aria-hidden
            style={{ color: accentColor }}
          >
            ›
          </span>
        </motion.article>
      </Link>

      {/* F24: Weak-items training button (visible only when there are fragile items) */}
      {mastery.weakCount > 0 && (
        <Link
          href={`/practicar/${module.id}?weak=1`}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-colors duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            background: 'color-mix(in srgb, var(--color-gold) 12%, var(--color-panel))',
            border: '1px solid color-mix(in srgb, var(--color-gold) 30%, transparent)',
            color: 'var(--color-gold)',
          }}
          aria-label={`Entrenar ${mastery.weakCount} debilidades en ${module.label}`}
        >
          🎯 Entrenar debilidades ({mastery.weakCount})
        </Link>
      )}
    </div>
  );
}
