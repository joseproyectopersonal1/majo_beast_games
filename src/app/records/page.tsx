/**
 * /records — Salón de Récords.
 *
 * Shows per-module × per-mode best scores, streaks, and global accuracy.
 */

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MODULES } from '@/content/modules';
import { GAME_MODES } from '@/content/types';
import { useRecordsStore } from '@/state/useRecordsStore';
import { useStreaksStore } from '@/state/useStreaksStore';
import { useAchievementsStore } from '@/state/useAchievementsStore';
import { ACHIEVEMENTS } from '@/domain/achievements/catalog';
import { AchievementBadge } from '@/ui/achievements/AchievementBadge';

const STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
};

const MODE_LABELS: Record<string, string> = {
  'reto-reloj': 'Reto Reloj',
  'memoria': 'Memoria',
  'jefe-final': 'Jefe Final',
};

export default function RecordsPage() {
  const router = useRouter();
  const byKey = useRecordsStore((s) => s.byKey);
  const globals = useRecordsStore((s) => s.globals);
  const accuracy = useRecordsStore((s) => s.accuracyPercent());
  const bestAnswerStreak = useStreaksStore((s) => s.bestAnswerStreak);
  const currentAnswerStreak = useStreaksStore((s) => s.currentAnswerStreak);
  const bestDayStreak = useStreaksStore((s) => s.bestDayStreak);
  const currentDayStreak = useStreaksStore((s) => s.currentDayStreak);
  const unlockedIds = useAchievementsStore((s) => s.unlockedIds);
  const unlockedSet = new Set(unlockedIds);
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedIds.length;

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer"
        >
          ← Volver
        </button>
        <h1
          className="font-[family-name:var(--font-display)] text-2xl uppercase"
          style={{ color: 'var(--color-gold)' }}
        >
          🏆 Récords
        </h1>
        <div className="w-16" aria-hidden />
      </header>

      <main className="flex-1 px-5 pb-8 flex flex-col gap-6">
        {/* Global stats */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <SectionTitle>Estadísticas globales</SectionTitle>
          <div
            className="grid grid-cols-3 gap-2 rounded-2xl p-4 border border-white/10"
            style={{ background: 'var(--color-panel)' }}
          >
            <Stat label="Respondidas" value={globals.totalAnswered} />
            <Stat label="Correctas" value={globals.totalCorrect} />
            <Stat label="Precisión" value={`${accuracy}%`} />
          </div>
        </motion.section>

        {/* Streaks */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <SectionTitle>Rachas</SectionTitle>
          <div
            className="grid grid-cols-2 gap-3 rounded-2xl p-4 border border-white/10"
            style={{ background: 'var(--color-panel)' }}
          >
            <StreakBlock
              label="Racha respuestas"
              current={currentAnswerStreak}
              best={bestAnswerStreak}
              icon="⚡"
            />
            <StreakBlock
              label="Racha de días"
              current={currentDayStreak}
              best={bestDayStreak}
              icon="🔥"
            />
          </div>
        </motion.section>

        {/* Per-module records */}
        <motion.section
          variants={STAGGER.container}
          initial="hidden"
          animate="show"
        >
          <SectionTitle>Por módulo</SectionTitle>
          <div className="flex flex-col gap-3">
            {MODULES.map((module) => (
              <motion.div
                key={module.id}
                variants={STAGGER.item}
                className="rounded-2xl border border-white/10 overflow-hidden"
                style={{ background: 'var(--color-panel)' }}
              >
                {/* Module header */}
                <div
                  className="px-4 py-2 flex items-center gap-2"
                  style={{ background: `color-mix(in srgb, var(--color-${module.accent}) 12%, transparent)` }}
                >
                  <span className="text-xl" aria-hidden>{module.emoji}</span>
                  <h3 className="font-[family-name:var(--font-display)] text-sm uppercase">
                    {module.label}
                  </h3>
                </div>
                {/* Records per mode */}
                {GAME_MODES.map((mode) => {
                  const key = `${module.id}.${mode}`;
                  const rec = byKey[key];
                  return (
                    <div
                      key={mode}
                      className="flex items-center px-4 py-2 border-t border-white/5"
                    >
                      <span className="text-xs text-white/40 w-28">{MODE_LABELS[mode]}</span>
                      {rec ? (
                        <>
                          <span className="text-xs mr-4" style={{ color: 'var(--color-gold)' }}>
                            🪙 {rec.bestScore.toLocaleString()}
                          </span>
                          <span className="text-xs text-white/50 mr-4">
                            Peldaño {rec.bestRung + 1}
                          </span>
                          <span className="text-xs text-white/30 ml-auto">
                            {rec.playedCount}x
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-white/25 italic">Sin partidas</span>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>🏅 Logros</SectionTitle>
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--color-gold)' }}
            >
              {unlockedCount}/{totalAchievements}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.map((a) => (
              <AchievementBadge
                key={a.id}
                achievement={a}
                unlocked={unlockedSet.has(a.id)}
              />
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-2">
      {children}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-[family-name:var(--font-display)] text-2xl leading-none"
        style={{ color: 'var(--color-gold)' }}
      >
        {value}
      </span>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}

function StreakBlock({
  label,
  current,
  best,
  icon,
}: {
  label: string;
  current: number;
  best: number;
  icon: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-white/40 uppercase tracking-widest">{icon} {label}</p>
      <p className="font-[family-name:var(--font-display)] text-2xl" style={{ color: 'var(--color-gold)' }}>
        {current}
      </p>
      <p className="text-xs text-white/30">Récord: {best}</p>
    </div>
  );
}
