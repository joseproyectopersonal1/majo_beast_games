/**
 * PowerupCard — shop card for a single powerup (T07 skin).
 *
 * Gold-framed card sized for the 2-column "Tienda Bestial" grid: icon, name,
 * description, price, and a gold COMPRAR button (disabled when unaffordable).
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Powerup } from '@/domain/shop/powerups';
import { useInventoryStore, InsufficientCoinsError } from '@/state/useInventoryStore';
import { useAchievementsStore } from '@/state/useAchievementsStore';

interface PowerupCardProps {
  powerup: Powerup;
  coins: number;
  quantity: number;
}

export function PowerupCard({ powerup, coins, quantity }: PowerupCardProps) {
  const purchase = useInventoryStore((s) => s.purchase);
  const signalPurchase = useAchievementsStore((s) => s.signalPurchase);
  const checkAndUnlock = useAchievementsStore((s) => s.checkAndUnlock);
  const [buying, setBuying] = useState(false);
  const [flash, setFlash] = useState<'success' | 'error' | null>(null);
  const canAfford = coins >= powerup.price;

  async function handleBuy() {
    if (buying || !canAfford) return;
    setBuying(true);
    try {
      await purchase(powerup.id);
      setFlash('success');
      signalPurchase();
      void checkAndUnlock();
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
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="beast-frame relative flex flex-col gap-2 p-3.5 h-full"
    >
      {/* Icon + name */}
      <div className="flex items-start gap-2">
        <span className="text-3xl leading-none" aria-hidden>{powerup.emoji}</span>
        <div className="flex-1 min-w-0">
          <p
            className="uppercase leading-none text-sm"
            style={{ fontFamily: 'var(--font-display), system-ui' }}
          >
            {powerup.name}
          </p>
          {quantity > 0 && (
            <span className="text-[10px] font-bold" style={{ color: 'var(--color-lime)' }}>
              ✓ tienes {quantity}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-white/55 leading-snug flex-1">{powerup.description}</p>

      {/* Price */}
      <span
        className="inline-flex items-center gap-1 text-base"
        style={{
          fontFamily: 'var(--font-display), system-ui',
          color: canAfford ? 'var(--color-gold)' : 'var(--color-ink-dim)',
        }}
      >
        🪙 {powerup.price.toLocaleString('es')}
      </span>

      {/* Buy button */}
      <button
        type="button"
        onClick={handleBuy}
        disabled={buying || !canAfford}
        className={[
          'w-full py-2 rounded-xl text-sm font-bold uppercase tracking-wide cursor-pointer',
          canAfford ? 'beast-btn-gold' : 'opacity-50',
        ].join(' ')}
        style={
          canAfford
            ? undefined
            : { background: 'var(--color-panel-2)', color: 'var(--color-ink-dim)', border: '1px solid rgba(255,255,255,0.08)' }
        }
        aria-label={`Comprar ${powerup.name} por ${powerup.price} monedas`}
      >
        {buying ? '...' : canAfford ? 'Comprar' : 'Sin saldo'}
      </button>

      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] pointer-events-none"
            style={{ background: flash === 'success' ? 'rgba(57,255,136,0.18)' : 'rgba(255,59,59,0.18)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-3xl">{flash === 'success' ? '✅' : '❌'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
