/**
 * /tienda — Tienda Bestial (powerup shop).
 *
 * Shows the player's current coin balance and a grid of all 6 powerups.
 * Purchases are handled inside PowerupCard via useInventoryStore.
 */

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { POWERUPS } from '@/domain/shop/powerups';
import { PowerupCard } from '@/ui/shop/PowerupCard';
import { useInventoryStore } from '@/state/useInventoryStore';
import { useProgressStore } from '@/state';

const STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
};

export default function TiendaPage() {
  const router = useRouter();
  const coins = useProgressStore((s) => s.prizeLedger.coins);
  const quantities = useInventoryStore((s) => s.quantities);

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
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
          🛒 Tienda Bestial
        </h1>
        <span
          className="font-[family-name:var(--font-display)] text-lg"
          style={{ color: 'var(--color-gold)' }}
          aria-label={`${coins} monedas`}
        >
          🪙 {coins.toLocaleString()}
        </span>
      </header>

      <p className="px-5 text-xs text-white/30 mb-4">
        Las ventajas te ayudan en el juego. ¡Nunca responden por ti!
      </p>

      {/* Grid */}
      <main className="flex-1 px-5 pb-8">
        <motion.div
          className="flex flex-col gap-3"
          variants={STAGGER.container}
          initial="hidden"
          animate="show"
          role="list"
          aria-label="Ventajas disponibles"
        >
          {POWERUPS.map((powerup) => (
            <motion.div key={powerup.id} variants={STAGGER.item} role="listitem">
              <PowerupCard
                powerup={powerup}
                coins={coins}
                quantity={quantities[powerup.id] ?? 0}
              />
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
