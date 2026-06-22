/**
 * /aprender/[moduleId] — Flashcard / learn screen.
 *
 * Flow: show prompt → "Revelar" → show answer → "✓ Lo sabía" / "✗ No lo sabía"
 * Records self-assessment to Leitner so the game engine stays up-to-date.
 * No timer, no lives, no coins — pure study mode.
 */

'use client';

import { use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULE_IDS, type ModuleId } from '@/content/types';
import { MODULES } from '@/content/modules';
import { getModuleItems } from '@/content/registry';
import { useProgressStore } from '@/state';
import { selectNextItem, initialState } from '@/domain/leitner/engine';
import { Button } from '@/ui/shared';
import { PromptDisplay } from '@/ui/game';
import { McmMcdLesson } from '@/ui/learn/McmMcdLesson';
import {
  TablasLesson,
  DivisionesLesson,
  VariasCifrasLesson,
  AnaliticosLesson,
} from '@/ui/learn/lessonConfigs';

/** Each island has its own dynamic guided lesson. */
const GUIDED_LESSON: Partial<Record<ModuleId, () => React.ReactElement>> = {
  tablas: TablasLesson,
  divisiones: DivisionesLesson,
  'varias-cifras': VariasCifrasLesson,
  'mcm-mcd': McmMcdLesson,
  analiticos: AnaliticosLesson,
};

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const TOTAL_CARDS = 10;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Phase = 'question' | 'revealed' | 'done';

function isModuleId(s: string): s is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(s);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AprenderPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = use(params);
  const router = useRouter();

  if (!isModuleId(moduleId)) {
    return <ErrorScreen message={`Módulo no encontrado: "${moduleId}"`} onBack={() => router.back()} />;
  }

  // T07 — every island has its own dynamic guided lesson. Flashcards (below)
  // remain as a fallback for any module without one.
  const Lesson = GUIDED_LESSON[moduleId];
  if (Lesson) {
    return <Lesson />;
  }

  const items = getModuleItems(moduleId);
  if (!items || items.length === 0) {
    return <ErrorScreen message="Este módulo aún no tiene contenido." onBack={() => router.back()} />;
  }

  return <LearnSession moduleId={moduleId} items={items} />;
}

/* ------------------------------------------------------------------ */
/* LearnSession                                                         */
/* ------------------------------------------------------------------ */

function LearnSession({
  moduleId,
  items,
}: {
  moduleId: ModuleId;
  items: ReturnType<typeof getModuleItems> & {};
}) {
  const router = useRouter();
  const moduleData = MODULES.find((m) => m.id === moduleId);

  const recordAnswer = useProgressStore((s) => s.recordAnswer);

  const [phase, setPhase] = useState<Phase>('question');
  const [cardIndex, setCardIndex] = useState(0);
  const [knewCount, setKnewCount] = useState(0);

  // Pick the first item lazily — we re-pick after each answer.
  const [currentItem, setCurrentItem] = useState(() => {
    const statesByItem = useProgressStore.getState().statesByItem;
    const moduleStates = Object.values(statesByItem).filter((s) =>
      s.itemId.startsWith(moduleId + '.'),
    );
    return selectNextItem(moduleStates, items) ?? items[0]!;
  });

  const handleReveal = useCallback(() => {
    setPhase('revealed');
  }, []);

  const handleSelfAssess = useCallback(
    (knew: boolean) => {
      void recordAnswer(currentItem.id, moduleId, knew, Date.now());
      if (knew) setKnewCount((k) => k + 1);

      const nextCount = cardIndex + 1;
      if (nextCount >= TOTAL_CARDS) {
        setCardIndex(nextCount);
        setPhase('done');
        return;
      }

      // Pick next item using updated Leitner state.
      const statesByItem = useProgressStore.getState().statesByItem;
      const moduleStates = Object.values(statesByItem).filter((s) =>
        s.itemId.startsWith(moduleId + '.'),
      );
      const next = selectNextItem(moduleStates, items) ?? items[0]!;
      setCurrentItem(next);
      setCardIndex(nextCount);
      setPhase('question');
    },
    [currentItem, cardIndex, moduleId, items, recordAnswer],
  );

  const accentColor = moduleData
    ? `var(--color-${moduleData.accent})`
    : 'var(--color-gold)';

  /**
   * Restart the session in place. router.refresh() leaves this client
   * component's state untouched, so it never restarted — reset locally.
   */
  function restart() {
    const statesByItem = useProgressStore.getState().statesByItem;
    const moduleStates = Object.values(statesByItem).filter((s) =>
      s.itemId.startsWith(moduleId + '.'),
    );
    setCurrentItem(selectNextItem(moduleStates, items) ?? items[0]!);
    setCardIndex(0);
    setKnewCount(0);
    setPhase('question');
  }

  /* ── Done screen ── */
  if (phase === 'done') {
    return (
      <motion.main
        className="min-h-full flex flex-col items-center justify-center px-6 gap-6 text-center max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <span className="text-8xl" aria-hidden>📖</span>
        <h1
          className="font-[family-name:var(--font-display)] text-4xl uppercase"
          style={{ color: accentColor }}
        >
          ¡Sesión lista!
        </h1>
        <div
          className="w-full grid grid-cols-2 gap-2 rounded-2xl p-4 border border-white/10"
          style={{ background: 'var(--color-panel)' }}
        >
          <ResultStat label="Sabía" value={knewCount} color="var(--color-lime)" />
          <ResultStat
            label="Por repasar"
            value={TOTAL_CARDS - knewCount}
            color="var(--color-gold)"
          />
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Button fullWidth onClick={restart}>
            Otra ronda
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.back()}>
            Volver
          </Button>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      className="min-h-full flex flex-col px-5 pt-4 pb-6 gap-4 max-w-sm mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer"
        >
          ← Volver
        </button>
        <span className="text-xs text-white/30">
          {cardIndex + 1} / {TOTAL_CARDS}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${(cardIndex / TOTAL_CARDS) * 100}%`,
            background: accentColor,
          }}
        />
      </div>

      {/* Card */}
      <div
        className="flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'var(--color-panel)' }}
      >
        {/* Prompt */}
        <div className="flex-1 flex items-center justify-center p-6">
          <PromptDisplay prompt={currentItem.prompt} />
        </div>

        {/* Answer reveal area */}
        <AnimatePresence>
          {phase === 'revealed' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div
                className="border-t border-white/10 px-6 py-5 text-center"
                style={{ background: 'var(--color-bg)' }}
              >
                <p className="text-xs text-white/30 mb-2 uppercase tracking-wider">
                  Respuesta
                </p>
                <span
                  className="font-[family-name:var(--font-display)] text-5xl leading-none"
                  style={{ color: accentColor }}
                >
                  {currentItem.answer.type === 'numeric'
                    ? currentItem.answer.value
                    : '—'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      {phase === 'question' ? (
        <Button fullWidth onClick={handleReveal}>
          Revelar respuesta
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSelfAssess(false)}
            className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl p-4 border border-white/10 cursor-pointer transition-colors"
            style={{ background: 'var(--color-panel)' }}
          >
            <span className="text-2xl" aria-hidden>✗</span>
            <span className="text-xs text-white/50">No lo sabía</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelfAssess(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl p-4 border border-white/10 cursor-pointer transition-colors"
            style={{ background: 'var(--color-panel)', borderColor: 'color-mix(in srgb, var(--color-lime) 35%, transparent)' }}
          >
            <span className="text-2xl" aria-hidden>✓</span>
            <span className="text-xs" style={{ color: 'var(--color-lime)' }}>
              Lo sabía
            </span>
          </button>
        </div>
      )}
    </motion.main>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function ResultStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-[family-name:var(--font-display)] text-4xl leading-none"
        style={{ color }}
      >
        {value}
      </span>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  );
}

function ErrorScreen({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <main className="min-h-full flex flex-col items-center justify-center gap-6 p-8 text-center max-w-sm mx-auto">
      <span className="text-6xl" aria-hidden>🚧</span>
      <p className="text-sm text-white/60 leading-relaxed">{message}</p>
      <Button variant="ghost" onClick={onBack}>← Volver</Button>
    </main>
  );
}
