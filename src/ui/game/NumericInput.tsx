/**
 * NumericInput — tactile numeric keypad for entering answers.
 *
 * Layout: 3×4 grid — rows [7 8 9] [4 5 6] [1 2 3] [⌫ 0 ✓].
 * The display shows the current input above the pad.
 * Backspace clears the last digit; ✓ confirms (disabled when empty).
 *
 * maxDigits defaults to 3 (covers all table/division answers ≤ 9×9 = 81,
 * and larger results in future modules up to 3 digits).
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

interface NumericInputProps {
  onConfirm: (value: number) => void;
  /** Freeze the pad during feedback/transition. */
  disabled?: boolean;
  maxDigits?: number;
  /** Clears the display when this key changes (e.g. new question). */
  resetKey?: number | string;
}

export function NumericInput({
  onConfirm,
  disabled = false,
  maxDigits = 3,
  resetKey,
}: NumericInputProps) {
  const [input, setInput] = useState('');

  // Clear the display whenever the question changes. Without this, digits typed
  // on a question that ended by timeout (no confirm) would linger into the next.
  useEffect(() => {
    setInput('');
  }, [resetKey]);

  const append = useCallback(
    (digit: string) => {
      if (disabled) return;
      setInput((prev) => (prev.length >= maxDigits ? prev : prev + digit));
    },
    [disabled, maxDigits],
  );

  const backspace = useCallback(() => {
    if (disabled) return;
    setInput((prev) => prev.slice(0, -1));
  }, [disabled]);

  const confirm = useCallback(() => {
    if (disabled || input === '') return;
    const value = parseInt(input, 10);
    setInput('');
    onConfirm(value);
  }, [disabled, input, onConfirm]);

  const KEYS: Array<{ label: string; action: () => void; accent?: boolean; muted?: boolean }> = [
    { label: '7', action: () => append('7') },
    { label: '8', action: () => append('8') },
    { label: '9', action: () => append('9') },
    { label: '4', action: () => append('4') },
    { label: '5', action: () => append('5') },
    { label: '6', action: () => append('6') },
    { label: '1', action: () => append('1') },
    { label: '2', action: () => append('2') },
    { label: '3', action: () => append('3') },
    { label: '⌫', action: backspace, muted: true },
    { label: '0', action: () => append('0') },
    { label: '✓', action: confirm, accent: true },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Display */}
      <div
        className="beast-frame w-full flex items-center justify-center min-h-[4.5rem]"
        aria-live="polite"
        aria-label={input ? `Valor ingresado: ${input}` : 'Sin valor ingresado'}
      >
        {input ? (
          <span
            className="text-5xl leading-none beast-title"
            style={{ fontFamily: 'var(--font-display), system-ui' }}
          >
            {input}
          </span>
        ) : (
          <span className="text-white/20 text-3xl select-none" aria-hidden>
            ?
          </span>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2.5 w-full" role="group" aria-label="Teclado numérico">
        {KEYS.map((key) => {
          const isConfirm = key.label === '✓';
          const isEmpty = input === '';

          return (
            <button
              key={key.label}
              type="button"
              onClick={key.action}
              disabled={disabled || (isConfirm && isEmpty)}
              aria-label={
                key.label === '⌫'
                  ? 'Borrar último dígito'
                  : key.label === '✓'
                    ? 'Confirmar respuesta'
                    : key.label
              }
              className={[
                'h-14 rounded-xl text-2xl leading-none cursor-pointer',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                key.muted
                  ? 'beast-frame text-white/70 transition-transform active:scale-[0.93]'
                  : 'beast-btn-gold',
              ].join(' ')}
              style={{ fontFamily: 'var(--font-display), system-ui' }}
            >
              {key.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
