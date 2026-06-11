/**
 * AchievementBadge — individual badge tile for the achievements grid.
 *
 * Unlocked: shows emoji + name in full color with glow.
 * Locked: dimmed silhouette with "?" and lock icon.
 */

'use client';

import { motion } from 'framer-motion';
import type { Achievement } from '@/domain/achievements/catalog';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
}

export function AchievementBadge({ achievement, unlocked }: AchievementBadgeProps) {
  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.05 } : undefined}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all"
      style={{
        background: unlocked
          ? 'color-mix(in srgb, var(--color-gold) 8%, var(--color-panel))'
          : 'var(--color-panel)',
        borderColor: unlocked
          ? 'color-mix(in srgb, var(--color-gold) 30%, transparent)'
          : 'rgba(255,255,255,0.05)',
        opacity: unlocked ? 1 : 0.5,
      }}
      aria-label={unlocked ? `Logro: ${achievement.name}` : `Logro bloqueado: ${achievement.name}`}
    >
      <span className="text-2xl" aria-hidden>
        {unlocked ? achievement.emoji : '🔒'}
      </span>
      <span
        className="text-[10px] font-semibold leading-tight"
        style={{ color: unlocked ? 'var(--color-gold)' : 'var(--color-ink-dim)' }}
      >
        {unlocked ? achievement.name : '???'}
      </span>
      {unlocked && (
        <span className="text-[9px] text-white/40 leading-tight">
          {achievement.description}
        </span>
      )}
    </motion.div>
  );
}
