/**
 * Teaching visuals for the guided lessons. Each is a small, self-contained
 * SVG/flex aid that makes a concept concrete:
 *   DotArray     — multiplication as rows × columns of dots
 *   ShareGroups  — division as equal sharing into baskets
 *   Decompose    — two-digit × one-digit by place value
 *   SequenceStrip— number patterns with the step between terms
 *   DivisorTracks— divisors of two numbers, common ones marked (MCD)
 */

'use client';

import { divisorsOf } from '@/domain/learn/lessons';

const FONT = 'var(--font-display), system-ui';

/* ── Multiplication: a rows of b dots ────────────────────────────── */

export function DotArray({ rows, cols, color = 'var(--color-gold)' }: { rows: number; cols: number; color?: string }) {
  return (
    <div className="beast-frame flex flex-col items-center gap-2 p-4">
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex gap-1.5">
            {Array.from({ length: cols }, (_, c) => (
              <span
                key={c}
                className="w-4 h-4 rounded-full"
                style={{ background: color, boxShadow: `0 0 6px -1px ${color}` }}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-white/55">
        {rows} grupos de {cols} = {rows * cols}
      </p>
    </div>
  );
}

/* ── Division: total items shared into `groups` baskets ──────────── */

export function ShareGroups({ total, groups, color = 'var(--color-magenta)' }: { total: number; groups: number; color?: string }) {
  const per = Math.floor(total / groups);
  return (
    <div className="beast-frame flex flex-col items-center gap-2 p-4">
      <div className="flex gap-2 flex-wrap justify-center">
        {Array.from({ length: groups }, (_, g) => (
          <div
            key={g}
            className="flex flex-col items-center justify-center gap-1 rounded-xl p-2"
            style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`, minWidth: 38 }}
          >
            <div className="grid grid-cols-2 gap-1">
              {Array.from({ length: per }, (_, i) => (
                <span key={i} className="w-3 h-3 rounded-full" style={{ background: color }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/55">
        {total} repartido en {groups} grupos = {per} en cada uno
      </p>
    </div>
  );
}

/* ── Multi-digit: place-value decomposition ──────────────────────── */

export function Decompose({ a, b }: { a: number; b: number }) {
  const tens = Math.floor(a / 10) * 10;
  const units = a % 10;
  const p1 = tens * b;
  const p2 = units * b;
  return (
    <div className="beast-frame flex flex-col items-center gap-2 p-4 text-center" style={{ fontFamily: FONT }}>
      <p className="text-sm text-white/55" style={{ fontFamily: 'var(--font-body)' }}>
        Separa {a} en {tens} y {units}:
      </p>
      <p className="text-xl leading-relaxed">
        <span style={{ color: 'var(--color-lime)' }}>({tens}×{b})</span>
        <span className="text-white/50"> + </span>
        <span style={{ color: 'var(--color-cyan)' }}>({units}×{b})</span>
      </p>
      <p className="text-2xl">
        <span style={{ color: 'var(--color-lime)' }}>{p1}</span>
        <span className="text-white/50"> + </span>
        <span style={{ color: 'var(--color-cyan)' }}>{p2}</span>
        <span className="text-white/50"> = </span>
        <span style={{ color: 'var(--color-gold)' }}>{p1 + p2}</span>
      </p>
    </div>
  );
}

/* ── Patterns: terms with the step between them ──────────────────── */

export function SequenceStrip({
  terms,
  diff,
  answer,
  solved,
}: {
  terms: number[];
  diff: number;
  answer: number;
  solved: boolean;
}) {
  const cells = [...terms, solved ? answer : null];
  return (
    <div className="beast-frame flex flex-col items-center gap-2 p-4">
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {cells.map((v, i) => (
          <span key={i} className="flex items-center gap-1">
            <span
              className="min-w-9 h-10 px-2 rounded-lg flex items-center justify-center text-lg"
              style={{
                fontFamily: FONT,
                background: v === null ? 'rgba(255,195,0,0.12)' : 'var(--color-panel-2)',
                border: `2px solid ${v === null ? 'var(--color-gold)' : (solved && i === cells.length - 1 ? 'var(--color-lime)' : 'transparent')}`,
                color: v === null ? 'var(--color-gold)' : '#fff',
              }}
            >
              {v === null ? '?' : v}
            </span>
            {i < cells.length - 1 && (
              <span className="text-[10px] font-bold px-1 rounded" style={{ color: 'var(--color-gold-2)' }}>
                +{diff}
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="text-xs text-white/55">Cada número sube {diff}.</p>
    </div>
  );
}

/* ── MCD: divisors of each number, common ones marked ────────────── */

export function DivisorTracks({ a, b, answer, solved }: { a: number; b: number; answer: number; solved: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <DivisorRow label={`Divisores de ${a}`} n={a} other={b} answer={answer} solved={solved} color="var(--color-lime)" />
      <DivisorRow label={`Divisores de ${b}`} n={b} other={a} answer={answer} solved={solved} color="var(--color-cyan)" />
    </div>
  );
}

function DivisorRow({
  label,
  n,
  other,
  answer,
  solved,
  color,
}: {
  label: string;
  n: number;
  other: number;
  answer: number;
  solved: boolean;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {divisorsOf(n).map((d) => {
          const isCommon = other % d === 0;
          const isAnswer = d === answer;
          const ring = solved && isAnswer ? 'var(--color-gold)' : isCommon ? 'color-mix(in srgb, var(--color-gold) 55%, transparent)' : 'transparent';
          return (
            <span
              key={d}
              className="min-w-9 h-9 px-2 rounded-lg flex items-center justify-center text-base"
              style={{
                fontFamily: FONT,
                background: solved && isAnswer ? 'color-mix(in srgb, var(--color-gold) 22%, var(--color-panel))' : 'var(--color-panel)',
                color: solved && isAnswer ? 'var(--color-gold)' : '#fff',
                border: `2px solid ${ring}`,
              }}
            >
              {d}
            </span>
          );
        })}
      </div>
    </div>
  );
}
