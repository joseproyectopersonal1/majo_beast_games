/**
 * useSettingsStore — audio toggle, onboarding flag and last played module,
 * mirrored to Dexie.
 */

'use client';

import { create } from 'zustand';
import { settingsRepo } from '@/infra/db/repos';
import { audioManager } from '@/infra/audio/manager';
import type { ModuleId } from '@/content/types';

type SettingsState = {
  audioEnabled: boolean;
  hasOnboarded: boolean;
  /** T04 §A.3 — last module the player started a game in (for /jugar). */
  lastPlayedModule: ModuleId | null;
  loaded: boolean;
};

type SettingsActions = {
  loadFromDb: () => Promise<void>;
  setAudio: (enabled: boolean) => Promise<void>;
  markOnboarded: () => Promise<void>;
  setLastPlayedModule: (moduleId: ModuleId) => Promise<void>;
  hardReset: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState & SettingsActions>(
  (set) => ({
    audioEnabled: true,
    hasOnboarded: false,
    lastPlayedModule: null,
    loaded: false,

    async loadFromDb() {
      const s = await settingsRepo.get();
      audioManager.setEnabled(s.audioEnabled);
      set({
        audioEnabled: s.audioEnabled,
        hasOnboarded: s.hasOnboarded,
        lastPlayedModule: s.lastPlayedModule ?? null,
        loaded: true,
      });
    },

    async setAudio(enabled) {
      await settingsRepo.setAudio(enabled);
      audioManager.setEnabled(enabled);
      set({ audioEnabled: enabled });
    },

    async markOnboarded() {
      await settingsRepo.markOnboarded();
      set({ hasOnboarded: true });
    },

    async setLastPlayedModule(moduleId) {
      await settingsRepo.setLastPlayedModule(moduleId);
      set({ lastPlayedModule: moduleId });
    },

    /** Destructive: wipes the entire DB (T04 /ajustes "Borrar todo"). */
    async hardReset() {
      await settingsRepo.hardReset();
    },
  }),
);
