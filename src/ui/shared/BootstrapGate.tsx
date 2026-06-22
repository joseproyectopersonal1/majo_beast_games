/**
 * BootstrapGate — client-side shell that blocks rendering until the app
 * has bootstrapped (IndexedDB checked, stores hydrated, session updated).
 *
 * States:
 *   loading  → spinner
 *   no-db    → hard error: IndexedDB unavailable (private mode / old browser)
 *   error    → generic error with reload button
 *   ready    → renders children normally
 *
 * This component is the ONLY place in the app that calls useBootstrap().
 * It must be a Client Component; the root layout imports it as such.
 */

'use client';

import { useBootstrap } from '@/state';

function Spinner() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-6">
      <div
        className="w-14 h-14 rounded-full border-4 border-white/10 border-t-(--color-gold) animate-spin"
        aria-hidden
      />
      <p className="text-(--color-gold) text-xs font-semibold uppercase tracking-[0.25em]">
        Cargando…
      </p>
    </div>
  );
}

function NoDbScreen() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-6 text-center">
      <span className="text-6xl" aria-hidden>
        📵
      </span>
      <h1
        className="font-[family-name:var(--font-display)] text-4xl uppercase text-(--color-gold)"
      >
        Sin acceso
      </h1>
      <p className="text-sm text-white/60 max-w-xs leading-relaxed">
        Majos Games necesita almacenamiento local (IndexedDB) para guardar tu
        progreso. Desactiva la navegación privada o usa un navegador moderno.
      </p>
    </div>
  );
}

function ErrorScreen({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : 'Error desconocido';

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 gap-6 text-center">
      <span className="text-6xl" aria-hidden>
        ⚠️
      </span>
      <h1
        className="font-[family-name:var(--font-display)] text-4xl uppercase"
        style={{ color: 'var(--color-red-glow)' }}
      >
        Error de inicio
      </h1>
      <p className="text-sm text-white/60 max-w-xs leading-relaxed font-mono">
        {message}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={[
          'px-6 py-3 rounded-xl font-bold text-(--color-bg)',
          'bg-(--color-gold) hover:brightness-110 active:scale-[0.97]',
          'transition-all duration-150 cursor-pointer',
        ].join(' ')}
      >
        Recargar
      </button>
    </div>
  );
}

export function BootstrapGate({ children }: { children: React.ReactNode }) {
  const status = useBootstrap();

  if (status.status === 'loading') return <Spinner />;
  if (status.status === 'no-db') return <NoDbScreen />;
  if (status.status === 'error') return <ErrorScreen error={status.error} />;
  return <>{children}</>;
}
