/**
 * BeastMascot — "Bengala", the white-tiger mascot from the Stitch interface.
 *
 * Pure inline SVG (no image asset needed) so it scales crisply and inherits
 * the stage lighting. Used as a hero accent on the module modal, the game-over
 * podium, the records hall, and the roulette.
 */

'use client';

interface BeastMascotProps {
  size?: number;
  className?: string;
  /** Adds the gentle idle float animation. */
  float?: boolean;
}

export function BeastMascot({ size = 120, className = '', float = false }: BeastMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      role="img"
      aria-label="Bengala, el tigre de Beast Games"
      className={[float ? 'beast-anim-float' : '', className].filter(Boolean).join(' ')}
    >
      <defs>
        <radialGradient id="bm-fur" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#eae6f5" />
          <stop offset="100%" stopColor="#c7bfe0" />
        </radialGradient>
        <linearGradient id="bm-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7aa8" />
          <stop offset="100%" stopColor="#ff2d78" />
        </linearGradient>
      </defs>

      {/* Ears */}
      <path d="M44 52 L36 14 L80 40 Z" fill="url(#bm-fur)" stroke="#1a1330" strokeWidth="3" strokeLinejoin="round" />
      <path d="M156 52 L164 14 L120 40 Z" fill="url(#bm-fur)" stroke="#1a1330" strokeWidth="3" strokeLinejoin="round" />
      <path d="M48 44 L43 24 L68 39 Z" fill="url(#bm-ear)" />
      <path d="M152 44 L157 24 L132 39 Z" fill="url(#bm-ear)" />

      {/* Head */}
      <path
        d="M100 36 C146 36 168 70 168 108 C168 150 138 178 100 178 C62 178 32 150 32 108 C32 70 54 36 100 36 Z"
        fill="url(#bm-fur)"
        stroke="#1a1330"
        strokeWidth="3.5"
      />

      {/* Forehead stripes */}
      <path d="M100 44 L100 70" stroke="#15102a" strokeWidth="7" strokeLinecap="round" />
      <path d="M84 50 L78 74" stroke="#15102a" strokeWidth="6" strokeLinecap="round" />
      <path d="M116 50 L122 74" stroke="#15102a" strokeWidth="6" strokeLinecap="round" />

      {/* Cheek stripes */}
      <path d="M40 104 L66 110" stroke="#15102a" strokeWidth="6" strokeLinecap="round" />
      <path d="M38 122 L64 124" stroke="#15102a" strokeWidth="6" strokeLinecap="round" />
      <path d="M160 104 L134 110" stroke="#15102a" strokeWidth="6" strokeLinecap="round" />
      <path d="M162 122 L136 124" stroke="#15102a" strokeWidth="6" strokeLinecap="round" />

      {/* Eyes */}
      <ellipse cx="74" cy="104" rx="14" ry="16" fill="#0a0814" />
      <ellipse cx="126" cy="104" rx="14" ry="16" fill="#0a0814" />
      <circle cx="74" cy="101" r="8" fill="#ffc300" />
      <circle cx="126" cy="101" r="8" fill="#ffc300" />
      <circle cx="76" cy="99" r="3" fill="#ffffff" />
      <circle cx="128" cy="99" r="3" fill="#ffffff" />

      {/* Muzzle + nose */}
      <path d="M100 122 C112 122 120 130 120 140 C120 152 110 160 100 160 C90 160 80 152 80 140 C80 130 88 122 100 122 Z" fill="#ffffff" />
      <path d="M88 132 L112 132 L100 144 Z" fill="#ff2d78" stroke="#c41d57" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M100 144 L100 154" stroke="#1a1330" strokeWidth="3" strokeLinecap="round" />
      <path d="M100 154 C94 154 92 150 90 150" stroke="#1a1330" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M100 154 C106 154 108 150 110 150" stroke="#1a1330" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Whiskers */}
      <path d="M82 140 L46 134" stroke="#cfc8e6" strokeWidth="2" strokeLinecap="round" />
      <path d="M82 146 L48 150" stroke="#cfc8e6" strokeWidth="2" strokeLinecap="round" />
      <path d="M118 140 L154 134" stroke="#cfc8e6" strokeWidth="2" strokeLinecap="round" />
      <path d="M118 146 L152 150" stroke="#cfc8e6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
