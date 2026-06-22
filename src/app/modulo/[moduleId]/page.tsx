/**
 * /modulo/[moduleId] — module ("island") detail page.
 *
 * Restyled (T07) to match the Stitch "ISLA DE LAS …" card: three big stacked
 * action buttons (Aprender / Practicar / Jugar) and a row of three game-mode
 * chips (Reto Reloj / Memoria / Jefe Final), with Bengala peeking in.
 *
 * Navigation logic is unchanged: modes gate on hasContent(); anything not yet
 * playable opens the "próximamente" modal instead of 404-ing.
 *
 * Note: Next.js 16 passes params as Promise — use React.use() in Client
 * Components (see dynamic-routes.md).
 */

'use client';

import { use, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MODULE_IDS, type ModuleId } from '@/content/types';
import { MODULES } from '@/content/modules';
import { hasContent } from '@/content/registry';
import { useProgressStore } from '@/state';
import { Button, MasteryBar, Modal } from '@/ui/shared';
import { BeastMascot } from '@/ui/brand';

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type GameMode = 'reto-reloj' | 'memoria' | 'jefe-final';

function isModuleId(s: string): s is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(s);
}

const MODE_CHIPS: readonly { id: GameMode; icon: string; label: string }[] = [
  { id: 'reto-reloj', icon: '⏱', label: 'Reto Reloj' },
  { id: 'memoria', icon: '🧠', label: 'Memoria' },
  { id: 'jefe-final', icon: '👊', label: 'Jefe Final' },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = use(params);
  const router = useRouter();

  const moduleMastery = useProgressStore((s) => s.moduleMastery);
  const [comingSoon, setComingSoon] = useState(false);

  if (!isModuleId(moduleId)) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-5xl" aria-hidden>❓</span>
        <p className="text-white/60 text-sm">Módulo no encontrado: {moduleId}</p>
        <Button variant="ghost" onClick={() => router.back()}>
          ← Volver
        </Button>
      </main>
    );
  }

  const moduleData = MODULES.find((m) => m.id === moduleId);
  if (!moduleData) return null;

  const mastery = moduleMastery[moduleId] ?? {
    masteredCount: 0,
    inProgressCount: 0,
    weakCount: 0,
    masteryPercent: 0,
  };

  const live = hasContent(moduleId);

  const goMode = (mode: GameMode) =>
    live ? () => router.push(`/jugar/${moduleId}/${mode}`) : () => setComingSoon(true);
  const goLearn = live ? () => router.push(`/aprender/${moduleId}`) : () => setComingSoon(true);
  const goPractice = live ? () => router.push(`/practicar/${moduleId}`) : () => setComingSoon(true);

  return (
    <main className="min-h-full flex flex-col items-center px-4 pt-6 pb-10">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start flex items-center gap-1.5 text-sm text-white/50 hover:text-white/90 transition-colors cursor-pointer mb-4"
        aria-label="Volver al mapa"
      >
        ← Mapa
      </button>

      <motion.div
        className="beast-frame-glow relative w-full max-w-sm p-5 pt-6 overflow-visible"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        {/* Mascot peeking from the right */}
        <BeastMascot
          size={92}
          float
          className="absolute -top-12 -right-3 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
        />

        {/* Title */}
        <h1
          className="uppercase beast-title text-2xl leading-none mb-1 pr-16"
          style={{ fontFamily: 'var(--font-display), system-ui' }}
        >
          Isla de {moduleData.label}
        </h1>

        <div className="mb-5 pr-16">
          <MasteryBar percent={mastery.masteryPercent} accent={moduleData.accent} showPercent />
        </div>

        {/* Big action buttons */}
        <div className="flex flex-col gap-3">
          <BigAction
            icon="📖"
            title="Aprender"
            subtitle="Mira cómo funciona"
            gradient="linear-gradient(180deg,#a37bff,#7c3aed)"
            textColor="#fff"
            onClick={goLearn}
          />
          <BigAction
            icon="✏️"
            title="Practicar"
            subtitle="Sin tiempo, sin presión"
            gradient="linear-gradient(180deg,#7dffb0,#22c55e)"
            textColor="#06281a"
            onClick={goPractice}
          />
          <BigAction
            icon="🏆"
            title="Jugar"
            subtitle="¡Al show con premios!"
            className="beast-btn-gold"
            textColor="#2a1800"
            onClick={goMode('reto-reloj')}
          />
        </div>

        {/* Game-mode chips */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {MODE_CHIPS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={goMode(m.id)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl beast-frame transition-transform active:scale-95 cursor-pointer"
              aria-label={`Modo ${m.label}${live ? '' : ' (próximamente)'}`}
            >
              <span className="text-2xl leading-none" aria-hidden>{m.icon}</span>
              <span
                className="text-[11px] uppercase leading-none"
                style={{ fontFamily: 'var(--font-display), system-ui', color: 'var(--color-gold)' }}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Mastery mini-stats */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-2 mt-4">
        <MiniStat label="Dominadas" value={mastery.masteredCount} color="var(--color-lime)" />
        <MiniStat label="Aprendiendo" value={mastery.inProgressCount} color="var(--color-gold)" />
        <MiniStat label="Frágiles" value={mastery.weakCount} color="var(--color-red-glow)" />
      </div>

      <Modal open={comingSoon} onClose={() => setComingSoon(false)} title="¡Pronto!">
        <p className="text-center text-white/60 text-sm">
          Este modo se activa en la próxima fase.
          <br />
          Los módulos de contenido y las pantallas de juego están en construcción.
        </p>
        <Button fullWidth onClick={() => setComingSoon(false)}>
          Entendido
        </Button>
      </Modal>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function BigAction({
  icon,
  title,
  subtitle,
  gradient,
  textColor,
  className = '',
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  gradient?: string;
  textColor: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={['flex items-center gap-3 px-4 py-3 rounded-2xl text-left w-full cursor-pointer', className]
        .filter(Boolean)
        .join(' ')}
      style={gradient ? { background: gradient, color: textColor } : { color: textColor }}
    >
      <span className="text-2xl leading-none" aria-hidden>{icon}</span>
      <span className="flex flex-col leading-tight">
        <span className="uppercase text-lg" style={{ fontFamily: 'var(--font-display), system-ui' }}>
          {title}
        </span>
        <span className="text-xs opacity-80">{subtitle}</span>
      </span>
    </motion.button>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-3 rounded-xl beast-frame">
      <span
        className="text-2xl leading-none"
        style={{ fontFamily: 'var(--font-display), system-ui', color }}
      >
        {value}
      </span>
      <span className="text-[10px] text-white/45">{label}</span>
    </div>
  );
}
