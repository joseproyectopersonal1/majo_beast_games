/**
 * HomeScreen — "Mapa de Islas Bestial".
 *
 * Renders the broadcast header and the module catalogue as a winding island
 * map: each module is a glowing island node, laid out in a deterministic
 * zig-zag and joined by a dashed golden path (drawn behind the nodes with a
 * single non-scaling-stroke SVG so it stays crisp at any width).
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HomeHeader } from './HomeHeader';
import { IslandNode } from './ModuleCard';
import { MODULES } from '@/content/modules';
import { useProgressStore } from '@/state';

/** Vertical slot height per island (px). */
const SLOT = 150;
/** First node offset from the top of the map (px). */
const TOP = 76;

/** Deterministic node centres: zig-zag between 28% and 72% of the width. */
function nodeLayout() {
  return MODULES.map((module, i) => ({
    module,
    x: i % 2 === 0 ? 30 : 70, // percent
    y: TOP + i * SLOT, // px
  }));
}

/** Smooth dashed path string through the node centres (x in 0..100, y in px). */
function buildPath(nodes: { x: number; y: number }[]) {
  if (nodes.length === 0) return '';
  let d = `M ${nodes[0]!.x} ${nodes[0]!.y}`;
  for (let i = 1; i < nodes.length; i++) {
    const p0 = nodes[i - 1]!;
    const p1 = nodes[i]!;
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }
  return d;
}

const STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: {
    hidden: { opacity: 0, scale: 0.7 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 20 } },
  },
};

export function HomeScreen() {
  const moduleMastery = useProgressStore((s) => s.moduleMastery);

  const nodes = nodeLayout();
  const mapHeight = TOP + (MODULES.length - 1) * SLOT + 120;
  const path = buildPath(nodes);

  return (
    <div className="min-h-full flex flex-col">
      <HomeHeader />

      <main className="flex-1 flex flex-col px-4 pb-6">
        <h2
          className="text-center uppercase beast-title mt-1 mb-2"
          style={{ fontFamily: 'var(--font-display), system-ui', fontSize: '1.7rem' }}
        >
          Mapa de Islas
        </h2>

        {/* The map */}
        <div
          className="relative mx-auto w-full max-w-sm"
          style={{ height: mapHeight }}
          role="list"
          aria-label="Islas de matemáticas"
        >
          {/* Dashed golden path behind the nodes */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 100 ${mapHeight}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={path}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="2 7"
              opacity={0.5}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <motion.div variants={STAGGER.container} initial="hidden" animate="show" className="contents">
            {nodes.map(({ module, x, y }) => (
              <motion.div
                key={module.id}
                variants={STAGGER.item}
                role="listitem"
                className="absolute"
                style={{ left: `${x}%`, top: y, transform: 'translate(-50%, -50%)' }}
              >
                <IslandNode
                  module={module}
                  mastery={
                    moduleMastery[module.id] ?? {
                      masteredCount: 0,
                      inProgressCount: 0,
                      weakCount: 0,
                      masteryPercent: 0,
                    }
                  }
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        <p className="text-center text-xs text-white/35 mt-2">
          Toca una isla para entrar
        </p>
      </main>
    </div>
  );
}
