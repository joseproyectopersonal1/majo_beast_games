/**
 * /records — Muro de la Fama (Salón de Récords).
 *
 * T07 skin: broadcast status bar + gold title, a hero accuracy ring, and the
 * per-module / streak / achievement sections in gold stage frames.
 */

'use client';

import { motion } from 'framer-motion';
import { MODULES } from '@/content/modules';
import { GAME_MODES } from '@/content/types';
import { useRecordsStore } from '@/state/useRecordsStore';
import { useStreaksStore } from '@/state/useStreaksStore';
import { useAchievementsStore } from '@/state/useAchievementsStore';
import { ACHIEVEMENTS } from '@/domain/achievements/catalog';
import { AchievementBadge } from '@/ui/achievements/AchievementBadge';
import { TopStatusBar, PageTitle } from '@/ui/brand';

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
      <TopStatusBar />
      <PageTitle icon="🏆" className="mt-1 mb-4">Muro de la Fama</PageTitle>

      <main className="flex-1 px-4 pb-8 flex flex-col gap-6">
        {/* Hero: accuracy ring + global tallies */}
        <motion.section
          className="beast-frame-glow flex items-center gap-5 p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AccuracyRing percent={accuracy} />
          <div className="flex flex-col gap-2 flex-1">
            <HeroStat label="Respondidas" value={globals.totalAnswered} />
            <HeroStat label="Correctas" value={globals.totalCorrect} color="var(--color-lime)" />
            <HeroStat
              label="Mejor racha respuestas"
              value={bestAnswerStreak}
              color="var(--color-magenta)"
              icon="🔥"
            />
          </div>
        </motion.section>

        {/* Streaks */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <SectionTitle>Rachas</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <StreakBlock label="Racha respuestas" current={currentAnswerStreak} best={bestAnswerStreak} icon="⚡" />
            <StreakBlock label="Racha de días" current={currentDayStreak} best={bestDayStreak} icon="🔥" />
          </div>
        </motion.section>

        {/* Per-module records */}
        <motion.section variants={STAGGER.container} initial="hidden" animate="show">
          <SectionTitle>Por módulo</SectionTitle>
          <div className="flex flex-col gap-3">
            {MODULES.map((module) => (
              <motion.div
                key={module.id}
                variants={STAGGER.item}
                className="beast-frame overflow-hidden"
              >
                <div
                  className="px-4 py-2 flex items-center gap-2"
                  style={{ background: `color-mix(in srgb, var(--color-${module.accent}) 14%, transparent)` }}
                >
                  <span className="text-xl" aria-hidden>{module.emoji}</span>
                  <h3 className="uppercase text-sm" style={{ fontFamily: 'var(--font-display), system-ui' }}>
                    {module.label}
                  </h3>
                </div>
                {GAME_MODES.map((mode) => {
                  const key = `${module.id}.${mode}`;
                  const rec = byKey[key];
                  return (
                    <div key={mode} className="flex items-center px-4 py-2 border-t border-white/5">
                      <span className="text-xs text-white/40 w-28">{MODE_LABELS[mode]}</span>
                      {rec ? (
                        <>
                          <span className="text-xs mr-4" style={{ color: 'var(--color-gold)' }}>
                            🪙 {rec.bestScore.toLocaleString()}
                          </span>
                          <span className="text-xs text-white/50 mr-4">Peldaño {rec.bestRung + 1}</span>
                          <span className="text-xs text-white/30 ml-auto">{rec.playedCount}x</span>
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
            <span className="text-xs font-semibold" style={{ color: 'var(--color-gold)' }}>
              {unlockedCount}/{totalAchievements}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.map((a) => (
              <AchievementBadge key={a.id} achievement={a} unlocked={unlockedSet.has(a.id)} />
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

function AccuracyRing({ percent }: { percent: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative flex-none" style={{ width: 96, height: 96 }}>
      <svg width={96} height={96} viewBox="0 0 96 96" className="-rotate-90">
        <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <circle
          cx={48}
          cy={48}
          r={r}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease', filter: 'drop-shadow(0 0 6px rgba(255,195,0,0.6))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl leading-none" style={{ fontFamily: 'var(--font-display), system-ui', color: 'var(--color-gold)' }}>
          {clamped}%
        </span>
        <span className="text-[9px] uppercase tracking-wider text-white/45">Precisión</span>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  color = 'var(--color-ink)',
  icon,
}: {
  label: string;
  value: number;
  color?: string;
  icon?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] text-white/45">
        {icon && <span aria-hidden>{icon} </span>}
        {label}
      </span>
      <span className="text-lg leading-none" style={{ fontFamily: 'var(--font-display), system-ui', color }}>
        {value.toLocaleString('es')}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-2">{children}</p>
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
    <div className="beast-frame flex flex-col gap-1 p-4">
      <p className="text-[10px] text-white/40 uppercase tracking-widest">{icon} {label}</p>
      <p className="text-2xl leading-none" style={{ fontFamily: 'var(--font-display), system-ui', color: 'var(--color-gold)' }}>
        {current}
      </p>
      <p className="text-xs text-white/30">Récord: {best}</p>
    </div>
  );
}
