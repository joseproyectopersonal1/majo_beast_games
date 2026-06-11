/**
 * /jugar — smart shortcut (T04 §A.2 tab 2).
 *
 * Redirects to the mode picker of the LAST module the player played;
 * if they never played, the recommended module (highest fragile proportion,
 * else lowest mastery).
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore, useProgressStore } from '@/state';
import { recommendedModule } from '@/domain/reinforce/recommend';

export default function JugarShortcutPage() {
  const router = useRouter();
  const lastPlayedModule = useSettingsStore((s) => s.lastPlayedModule);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const moduleMastery = useProgressStore((s) => s.moduleMastery);

  useEffect(() => {
    if (!settingsLoaded) return;
    const target = lastPlayedModule ?? recommendedModule(moduleMastery);
    router.replace(`/modulo/${target}`);
  }, [settingsLoaded, lastPlayedModule, moduleMastery, router]);

  return (
    <div className="min-h-full flex items-center justify-center">
      <div
        className="w-10 h-10 rounded-full border-4 border-white/10 border-t-(--color-gold) animate-spin"
        aria-label="Cargando"
      />
    </div>
  );
}
