/**
 * /ajustes — settings screen (T04 §A.5: accessed from the Home header ⚙️).
 *
 * Minimal: audio toggle + hard reset with double confirmation.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSettingsStore, useProgressStore, useInventoryStore, useStreaksStore, useRecordsStore, useRouletteStore } from '@/state';
import { Button, Modal } from '@/ui/shared';

export default function AjustesPage() {
  const router = useRouter();
  const audioEnabled = useSettingsStore((s) => s.audioEnabled);
  const setAudio = useSettingsStore((s) => s.setAudio);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleHardReset() {
    setResetting(true);
    await useSettingsStore.getState().hardReset();
    // Clear all reactive caches.
    useProgressStore.getState().reset();
    useInventoryStore.getState().reset();
    useStreaksStore.getState().reset();
    useRecordsStore.getState().reset();
    useRouletteStore.getState().reset();
    // Full reload re-runs bootstrap with the clean DB.
    window.location.href = '/';
  }

  return (
    <motion.main
      className="min-h-full flex flex-col px-5 pt-6 pb-8 gap-6 max-w-sm mx-auto"
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
        <h1
          className="font-[family-name:var(--font-display)] text-2xl uppercase"
          style={{ color: 'var(--color-gold)' }}
        >
          ⚙️ Ajustes
        </h1>
        <div className="w-16" aria-hidden />
      </div>

      {/* Audio */}
      <section
        className="rounded-2xl p-4 border border-white/10 flex items-center justify-between"
        style={{ background: 'var(--color-panel)' }}
      >
        <div>
          <p className="font-semibold text-sm">Sonidos</p>
          <p className="text-xs" style={{ color: 'var(--color-ink-dim)' }}>
            Efectos de sonido del juego
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={audioEnabled}
          aria-label="Activar o desactivar sonidos"
          onClick={() => setAudio(!audioEnabled)}
          className="w-14 h-8 rounded-full relative transition-colors cursor-pointer"
          style={{ background: audioEnabled ? 'var(--color-gold)' : 'var(--color-panel-2)' }}
        >
          <span
            className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
            style={{ left: audioEnabled ? 'calc(100% - 28px)' : '4px' }}
          />
        </button>
      </section>

      {/* Danger zone */}
      <section
        className="rounded-2xl p-4 border flex flex-col gap-3"
        style={{ background: 'var(--color-panel)', borderColor: 'rgba(255,59,59,.3)' }}
      >
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--color-red-glow)' }}>
            Borrar todo el progreso
          </p>
          <p className="text-xs" style={{ color: 'var(--color-ink-dim)' }}>
            Se pierden monedas, récords, rachas e inventario. No se puede deshacer.
          </p>
        </div>
        <Button variant="ghost" fullWidth onClick={() => setConfirmReset(true)}>
          Borrar todo
        </Button>
      </section>

      {/* Confirmation modal */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="¿Borrar todo?">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--color-ink-dim)' }}>
            Se borrará TODO tu progreso para siempre: monedas, récords, rachas,
            ventajas y giros de ruleta. ¿Segura?
          </p>
          <Button fullWidth onClick={() => setConfirmReset(false)}>
            No, conservar mi progreso
          </Button>
          <Button variant="ghost" fullWidth onClick={handleHardReset} disabled={resetting}>
            {resetting ? 'Borrando…' : 'Sí, borrar todo'}
          </Button>
        </div>
      </Modal>
    </motion.main>
  );
}
