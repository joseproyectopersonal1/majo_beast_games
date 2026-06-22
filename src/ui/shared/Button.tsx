/**
 * Button — reusable styled button.
 *
 * Variants: primary (gold), ghost (outlined gold), danger (red).
 * Sizes:    sm | md | lg.
 */

'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  // T07 — beveled gold marquee button (styling lives in .beast-btn-gold).
  primary: 'beast-btn-gold font-bold uppercase tracking-wide',
  ghost:
    'bg-(--color-panel)/40 border border-(--color-gold)/60 text-(--color-gold) hover:bg-(--color-gold)/10 active:scale-[0.97] backdrop-blur-sm',
  danger:
    'bg-(--color-red-glow) text-white font-bold hover:brightness-110 active:scale-[0.97] shadow-[0_4px_0_0_#a01010]',
};

const SIZE: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2',
        'font-semibold tracking-wide transition-all duration-150 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT[variant],
        SIZE[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
