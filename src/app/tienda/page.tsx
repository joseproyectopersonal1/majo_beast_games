/**
 * /tienda — Tienda Bestial (powerup shop).
 *
 * T07 skin: broadcast status bar + gold "TIENDA BESTIAL" title, a
 * PODERES / ESTILO segmented control, and a 2-column grid of powerup cards.
 * The ESTILO (skins) tab is a styled placeholder — the cosmetic economy is
 * not wired up yet, so it advertises "próximamente" rather than faking it.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { POWERUPS } from '@/domain/shop/powerups';
import { PowerupCard } from '@/ui/shop/PowerupCard';
import { useInventoryStore } from '@/state/useInventoryStore';
import { useProgressStore } from '@/state';
import { TopStatusBar, PageTitle, BeastMascot } from '@/ui/brand';

type Tab = 'poderes' | 'estilo';

const STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
};

export default function TiendaPage() {
  const coins = useProgressStore((s) => s.prizeLedger.coins);
  const quantities = useInventoryStore((s) => s.quantities);
  const [tab, setTab] = useState<Tab>('poderes');

  return (
    <div className="min-h-full flex flex-col">
      <TopStatusBar />
      <PageTitle icon="🛒" className="mt-1 mb-4">Tienda</PageTitle>

      {/* Segmented control */}
      <div className="px-4 mb-4">
        <div className="beast-frame flex p-1 gap-1">
          <TabButton active={tab === 'poderes'} onClick={() => setTab('poderes')}>
            ⚡ Poderes
          </TabButton>
          <TabButton active={tab === 'estilo'} onClick={() => setTab('estilo')}>
            ✨ Estilo
          </TabButton>
        </div>
      </div>

      <main className="flex-1 px-4 pb-8">
        {tab === 'poderes' ? (
          <>
            <p className="text-xs text-white/35 mb-3">
              Las ventajas te ayudan en el juego. ¡Nunca responden por ti!
            </p>
            <motion.div
              className="grid grid-cols-2 gap-3"
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
          </>
        ) : (
          <div className="beast-frame flex flex-col items-center text-center gap-3 px-6 py-10 mt-2">
            <BeastMascot size={110} float />
            <h2
              className="uppercase beast-title text-xl"
              style={{ fontFamily: 'var(--font-display), system-ui' }}
            >
              Skins de Bengala
            </h2>
            <p className="text-sm text-white/55 max-w-[16rem]">
              Pieles, sonidos y efectos para personalizar a tu tigre.
              <br />
              <span style={{ color: 'var(--color-gold)' }}>¡Muy pronto!</span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'flex-1 py-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all cursor-pointer',
        active ? 'beast-btn-gold' : 'text-white/55 hover:text-white/90',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
