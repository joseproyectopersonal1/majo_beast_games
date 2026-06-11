/**
 * PowerupCard — shop card for a single powerup.
 *
 * Shows emoji, name, description, price, quantity owned, and a buy button.
 * Buy button is disabled when the player can't afford it.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Powerup } from '@/domain/shop/powerups';
import { useInventoryStore, InsufficientCoinsError } from '@/state/useInventoryStore';

interface PowerupCardProps {
  powerup: Powerup;
  coins: number;
  quantity: number;
}

export function PowerupCard({ powerup, coins, quantity }: PowerupCardProps) {
  const purchase = useInventoryStore((s) => s.purchase);
  const [buying, setBuying] = useState(false);
  const [flash, setFlash] = useState<'success' | 'error' | null>(null);
  const canAfford = coins >= powerup.price;

  async function handleBuy() {
    if (buying || !canAfford) return;
    setBuying(true);
    try {
      await purchase(powerup.id);
      setFlash('success');
    } catch (err) {
      if (err instanceof InsufficientCoinsError) {
        setFlash('error');
      }
    } finally {
      setBuying(false);
      setTimeout(() => setFlash(null), 1200);
    }
  }

  return (
    <motion.article
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative flex flex-col gap-3 rounded-2xl border border-white/10 p-4"
      style={{ background: 'var(--color-panel)' }}
    >
      {/* Emoji + name row */}
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>{powerup.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-[family-name:var(--font-display)] text-base uppercase leading-none truncate">
            {powerup.name}
          </p>
          <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-widest">
            {powerup.kind === 'per-use' ? 'Por uso' : 'Por ronda'}
          </p>
        </div>
        {quantity > 0 && (
          <span
            className="flex-none text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-gold)/20', color: 'var(--color-gold)' }}
          >
            ×{quantity}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-white/50 leading-relaxed">{powerup.description}</p>

      {/* Price + buy button */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-[family-name:var(--font-display)] text-lg"
          style={{ color: canAfford ? 'var(--color-gold)' : 'var(--color-text-muted)' }}
        >
          🪙 {powerup.price.toLocaleString()}
        </span>
        <button
          type="button"
          onClick={handleBuy}
          disabled={buying || !canAfford}
          className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: canAfford ? 'var(--color-gold)' : 'var(--color-panel)',
            color: canAfford ? '#000' : 'var(--color-text-muted)',
            border: canAfford ? 'none' : '1px solid var(--color-border)',
          }}
          aria-label={`Comprar ${powerup.name} por ${powerup.price} monedas`}
        >
          {buying ? '...' : 'Comprar'}
        </button>
      </div>

      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none"
            style={{ background: flash === 'success' ? 'rgba(0,200,100,0.15)' : 'rgba(200,0,0,0.15)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-2xl">{flash === 'success' ? '✅' : '❌'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
