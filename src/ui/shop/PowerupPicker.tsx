/**
 * PowerupPicker — pre-round selection screen.
 *
 * Shown before a game round when the player has powerups in inventory.
 * The player toggles which powerups to activate for the upcoming round.
 * Confirms → consumes the units and starts the round.
 */

'use client';

import { motion } from 'framer-motion';
import { POWERUPS } from '@/domain/shop/powerups';
import { useInventoryStore } from '@/state/useInventoryStore';
import { Button } from '@/ui/shared';

interface PowerupPickerProps {
  /** Called with the list of powerup IDs that were activated (before consuming). */
  onConfirm: (activatedIds: string[]) => void;
}

export function PowerupPicker({ onConfirm }: PowerupPickerProps) {
  const quantities = useInventoryStore((s) => s.quantities);
  const pendingActivation = useInventoryStore((s) => s.pendingActivation);
  const togglePending = useInventoryStore((s) => s.togglePending);
  const consumePending = useInventoryStore((s) => s.consumePending);

  const ownedPowerups = POWERUPS.filter((p) => (quantities[p.id] ?? 0) > 0);

  async function handleConfirm() {
    const activated = [...pendingActivation]; // snapshot before consuming
    await consumePending();
    onConfirm(activated);
  }

  return (
    <motion.div
      className="min-h-full flex flex-col px-5 pt-6 pb-8 gap-6 max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <div className="flex flex-col gap-1">
        <h1
          className="font-[family-name:var(--font-display)] text-3xl uppercase"
          style={{ color: 'var(--color-gold)' }}
        >
          Ventajas
        </h1>
        <p className="text-sm text-white/40">
          Activa las ventajas para esta ronda. Se consumen al empezar.
        </p>
      </div>

      {ownedPowerups.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-8">
          No tienes ventajas. Consíguelas en la 🛒 Tienda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {ownedPowerups.map((powerup) => {
            const active = pendingActivation.includes(powerup.id);
            const qty = quantities[powerup.id] ?? 0;
            return (
              <button
                key={powerup.id}
                type="button"
                onClick={() => togglePending(powerup.id)}
                className="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer"
                style={{
                  background: active ? 'color-mix(in srgb, var(--color-gold) 15%, var(--color-panel))' : 'var(--color-panel)',
                  borderColor: active ? 'var(--color-gold)' : 'color-mix(in srgb, white 10%, transparent)',
                }}
                aria-pressed={active}
                aria-label={`${active ? 'Desactivar' : 'Activar'} ${powerup.name}`}
              >
                <span className="text-2xl flex-none" aria-hidden>{powerup.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{powerup.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{powerup.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'color-mix(in srgb, white 10%, transparent)' }}
                  >
                    ×{qty}
                  </span>
                  {active && (
                    <span className="text-xs" style={{ color: 'var(--color-gold)' }}>✓</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {pendingActivation.length > 0 && (
          <p className="text-xs text-center" style={{ color: 'var(--color-gold)' }}>
            {pendingActivation.length} ventaja{pendingActivation.length !== 1 ? 's' : ''} activada{pendingActivation.length !== 1 ? 's' : ''}
          </p>
        )}
        <Button fullWidth onClick={handleConfirm}>
          {pendingActivation.length > 0 ? '¡Jugar con ventajas!' : 'Jugar sin ventajas'}
        </Button>
      </div>
    </motion.div>
  );
}
