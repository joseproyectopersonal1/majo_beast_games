/**
 * PageTitle — the centered gold marquee heading used below the status bar,
 * e.g. "🛒 TIENDA BESTIAL" or "🏆 MURO DE LA FAMA".
 */

'use client';

import type { ReactNode } from 'react';

interface PageTitleProps {
  /** Leading icon (emoji or node). */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageTitle({ icon, children, className = '' }: PageTitleProps) {
  return (
    <h1
      className={['flex items-center justify-center gap-2 uppercase text-center', className].join(' ')}
      style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: '1.9rem' }}
    >
      {icon && (
        <span aria-hidden style={{ color: 'var(--color-gold)' }}>
          {icon}
        </span>
      )}
      <span className="beast-title">{children}</span>
    </h1>
  );
}
