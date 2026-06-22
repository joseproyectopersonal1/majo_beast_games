/**
 * BeastLogo — the "BEAST GAMES" wordmark with a small tiger glyph, matching
 * the top-left lockup in the Stitch interface mockups.
 */

'use client';

interface BeastLogoProps {
  /** Glyph size in px. The wordmark scales with it. */
  size?: number;
  /** Hide the stacked "BEAST / GAMES" text and show only the glyph. */
  glyphOnly?: boolean;
  className?: string;
}

export function BeastLogo({ size = 34, glyphOnly = false, className = '' }: BeastLogoProps) {
  return (
    <span className={['inline-flex items-center gap-2 select-none', className].join(' ')}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        className="flex-none"
      >
        {/* rounded gold badge */}
        <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="#15102a" stroke="#ffc300" strokeWidth="2" />
        {/* tiger glyph */}
        <path d="M13 16 L10 8 L20 13 Z" fill="#fff" />
        <path d="M35 16 L38 8 L28 13 Z" fill="#fff" />
        <path d="M24 12 C33 12 38 19 38 27 C38 35 32 41 24 41 C16 41 10 35 10 27 C10 19 15 12 24 12 Z" fill="#fff" />
        <path d="M24 15 L24 23 M18 17 L17 24 M30 17 L31 24" stroke="#15102a" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="18.5" cy="27" r="2.6" fill="#15102a" />
        <circle cx="29.5" cy="27" r="2.6" fill="#15102a" />
        <path d="M21 33 L27 33 L24 37 Z" fill="#ff2d78" />
      </svg>

      {!glyphOnly && (
        <span
          className="flex flex-col leading-[0.92] uppercase"
          style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: '15px' }}
        >
          <span className="tracking-wide" style={{ color: '#ffffff' }}>
            Beast
          </span>
          <span className="tracking-wide" style={{ color: 'var(--color-gold)' }}>
            Games
          </span>
        </span>
      )}
    </span>
  );
}
