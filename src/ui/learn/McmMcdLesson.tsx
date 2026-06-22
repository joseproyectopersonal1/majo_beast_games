/**
 * McmMcdLesson — the MCM/MCD island covers two concepts, so its lesson opens
 * with a small chooser: learn MCM (multiples) or MCD (divisors).
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BeastMascot } from '@/ui/brand';
import { McmLesson } from './McmLesson';
import { McdLesson } from './lessonConfigs';

type Choice = 'menu' | 'mcm' | 'mcd';

export function McmMcdLesson() {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice>('menu');

  if (choice === 'mcm') return <McmLesson />;
  if (choice === 'mcd') return <McdLesson />;

  return (
    <main className="min-h-full flex flex-col px-5 pt-5 pb-10 gap-5 max-w-sm mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start text-sm text-white/50 hover:text-white/90 transition-colors cursor-pointer"
      >
        ← Volver
      </button>

      <motion.div
        className="beast-frame-glow flex flex-col items-center text-center gap-4 px-5 py-7"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BeastMascot size={88} float />
        <h1 className="uppercase beast-title text-3xl" style={{ fontFamily: 'var(--font-display), system-ui' }}>
          ¿Qué aprendemos?
        </h1>
        <p className="text-sm text-white/70">Elige un tema para empezar.</p>

        <div className="flex flex-col gap-3 w-full mt-1">
          <ChoiceButton
            title="MCM"
            subtitle="Mínimo Común Múltiplo"
            hint="El más pequeño al que llegan los dos saltando."
            gradient="linear-gradient(180deg,#7dffb0,#22c55e)"
            textColor="#06281a"
            onClick={() => setChoice('mcm')}
          />
          <ChoiceButton
            title="MCD"
            subtitle="Máximo Común Divisor"
            hint="El más grande que cabe exacto en los dos."
            gradient="linear-gradient(180deg,#a37bff,#7c3aed)"
            textColor="#fff"
            onClick={() => setChoice('mcd')}
          />
        </div>
      </motion.div>
    </main>
  );
}

function ChoiceButton({
  title,
  subtitle,
  hint,
  gradient,
  textColor,
  onClick,
}: {
  title: string;
  subtitle: string;
  hint: string;
  gradient: string;
  textColor: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-2xl text-left w-full cursor-pointer"
      style={{ background: gradient, color: textColor }}
    >
      <span className="uppercase text-2xl leading-none" style={{ fontFamily: 'var(--font-display), system-ui' }}>
        {title}
      </span>
      <span className="text-sm font-semibold">{subtitle}</span>
      <span className="text-xs opacity-80">{hint}</span>
    </motion.button>
  );
}
