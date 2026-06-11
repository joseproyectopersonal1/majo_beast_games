/**
 * AchievementToast — floating toast that appears when a new achievement
 * is unlocked. Auto-dismisses after 3.5s or on tap.
 *
 * Renders a slide-in from bottom with a gold glow and the achievement emoji.
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { achievementById, type AchievementId } from '@/domain/achievements/catalog';
import { audioManager } from '@/infra/audio/manager';

interface AchievementToastProps {
  achievementId: AchievementId | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievementId, onDismiss }: AchievementToastProps) {
  // Auto-dismiss after 3.5s
  useEffect(() => {
    if (!achievementId) return;
    audioManager.play('prize');
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [achievementId, onDismiss]);

  const achievement = achievementId ? achievementById(achievementId) : null;

  return (
    <AnimatePresence>
      {achievement && (
        <motion.button
          type="button"
          onClick={onDismiss}
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="fixed bottom-24 left-4 right-4 mx-auto max-w-sm z-[60] flex items-center gap-3 px-5 py-4 rounded-2xl border cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--color-panel) 0%, color-mix(in srgb, var(--color-gold) 12%, var(--color-panel)) 100%)',
            borderColor: 'color-mix(in srgb, var(--color-gold) 40%, transparent)',
            boxShadow: '0 0 24px rgba(255, 195, 0, 0.15), 0 4px 16px rgba(0,0,0,0.4)',
          }}
          aria-label={`Logro desbloqueado: ${achievement.name}`}
        >
          <motion.span
            className="flex-none text-4xl"
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: [0, 1.3, 1] }}
            transition={{ delay: 0.15, duration: 0.4, times: [0, 0.6, 1] }}
            aria-hidden
          >
            {achievement.emoji}
          </motion.span>
          <div className="flex flex-col gap-0.5 text-left min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-gold)' }}
            >
              🏅 ¡Logro desbloqueado!
            </span>
            <span className="text-sm font-semibold text-white truncate">
              {achievement.name}
            </span>
            <span className="text-xs text-white/50 truncate">
              {achievement.description}
            </span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
