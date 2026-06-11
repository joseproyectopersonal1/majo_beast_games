/**
 * useInventoryStore — reactive cache of the player's powerup inventory.
 *
 * Persisted to Dexie via inventoryRepo + purchasePowerup. Keeps a local
 * cache so the UI can read quantities without async calls.
 *
 * Also tracks which powerups the player has selected to activate for the
 * NEXT round (pendingActivation). These are consumed when the round starts.
 */

'use client';

import { create } from 'zustand';
import type { PowerupId } from '@/domain/shop/powerups';
import type { InventoryRow } from '@/infra/db/schema';
import {
  inventoryRepo,
  purchasePowerup,
  InsufficientCoinsError,
  prizeRepo,
} from '@/infra/db/repos';

type InventoryState = {
  /** Map of powerupId → quantity owned. */
  quantities: Partial<Record<PowerupId, number>>;
  /** Coins from the prize ledger (mirrored for display). */
  coins: number;
  /** Powerups selected by the player for the upcoming round. */
  pendingActivation: PowerupId[];
  loaded: boolean;
};

type InventoryActions = {
  loadFromDb: () => Promise<void>;
  /** Buy one unit of a powerup. Throws InsufficientCoinsError if balance too low. */
  purchase: (id: PowerupId) => Promise<void>;
  /** Toggle a powerup in pendingActivation. Requires at least 1 unit owned. */
  togglePending: (id: PowerupId) => void;
  /** Clear pendingActivation (call before a round starts after consuming). */
  clearPending: () => void;
  /** Consume all currently pending powerups from inventory (call on round start). */
  consumePending: () => Promise<void>;
  reset: () => void;
};

const INITIAL: InventoryState = {
  quantities: {},
  coins: 0,
  pendingActivation: [],
  loaded: false,
};

export const useInventoryStore = create<InventoryState & InventoryActions>(
  (set, get) => ({
    ...INITIAL,

    async loadFromDb() {
      const [rows, ledger] = await Promise.all([
        inventoryRepo.getAll(),
        prizeRepo.get(),
      ]);
      const quantities: Partial<Record<PowerupId, number>> = {};
      for (const row of rows) quantities[row.powerupId] = row.quantity;
      set({ quantities, coins: ledger.coins, loaded: true });
    },

    async purchase(id) {
      // Throws InsufficientCoinsError if coins insufficient (let caller handle).
      await purchasePowerup(id);
      // Refresh quantities and coins.
      const [rows, ledger] = await Promise.all([
        inventoryRepo.getAll(),
        prizeRepo.get(),
      ]);
      const quantities: Partial<Record<PowerupId, number>> = {};
      for (const row of rows) quantities[row.powerupId] = row.quantity;
      set({ quantities, coins: ledger.coins });
    },

    togglePending(id) {
      const { pendingActivation, quantities } = get();
      const owned = quantities[id] ?? 0;
      if (owned <= 0) return; // Can't activate what you don't own.
      const already = pendingActivation.includes(id);
      if (already) {
        set({ pendingActivation: pendingActivation.filter((x) => x !== id) });
      } else {
        set({ pendingActivation: [...pendingActivation, id] });
      }
    },

    clearPending() {
      set({ pendingActivation: [] });
    },

    async consumePending() {
      const { pendingActivation } = get();
      if (pendingActivation.length === 0) return;
      // Consume each pending powerup from DB.
      for (const id of pendingActivation) {
        await inventoryRepo.consume(id, 1);
      }
      // Refresh quantities.
      const rows = await inventoryRepo.getAll();
      const quantities: Partial<Record<PowerupId, number>> = {};
      for (const row of rows) quantities[row.powerupId] = row.quantity;
      set({ quantities, pendingActivation: [] });
    },

    reset: () => set(INITIAL),
  }),
);

export { InsufficientCoinsError };
