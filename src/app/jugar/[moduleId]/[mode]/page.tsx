/**
 * /jugar/[moduleId]/[mode] — game session page.
 *
 * Validates params, looks up content from the registry, and renders
 * GameScreen. Shows a friendly error if the module has no content yet.
 *
 * v2 (T02 F21): If the player has powerups in inventory, shows the
 * PowerupPicker first. Confirmed effects are passed to GameScreen.
 *
 * Next.js 16: params is a Promise — use React.use() in client components.
 */

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MODULE_IDS, GAME_MODES, type ModuleId } from '@/content/types';
import type { GameMode } from '@/content/types';
import { getModuleItems } from '@/content/registry';
import { GameScreen } from '@/ui/game';
import { Button } from '@/ui//shared';
import { PowerupPicker } from '@/ui/shop/PowerupPicker';
import { useInventoryStore } from '@/state/useInventoryStore';
import { buildEffects, type ActiveEffects } from '@/domain/shop/effects';

function isModuleId(s: string): s is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(s);
}

function isGameMode(s: string): s is GameMode {
  return (GAME_MODES as readonly string[]).includes(s);
}

export default function JugarPage({
  params,
}: {
  params: Promise<{ moduleId: string; mode: string }>;
}) {
  const { moduleId, mode } = use(params);
  const router = useRouter();

  /* Validate moduleId */
  if (!isModuleId(moduleId)) {
    return <ErrorScreen message={`Módulo desconocido: "${moduleId}"`} onBack={() => router.back()} />;
  }

  /* Validate mode */
  if (!isGameMode(mode)) {
    return <ErrorScreen message={`Modo desconocido: "${mode}"`} onBack={() => router.back()} />;
  }

  /* Look up items */
  const items = getModuleItems(moduleId);
  if (!items || items.length === 0) {
    return (
      <ErrorScreen
        message={`El módulo "${moduleId}" aún no tiene contenido. Estará disponible en una próxima fase.`}
        onBack={() => router.back()}
      />
    );
  }

  /* Only reto-reloj is implemented in F16 */
  if (mode !== 'reto-reloj') {
    return (
      <ErrorScreen
        message={`El modo "${mode}" estará disponible pronto.`}
        onBack={() => router.back()}
      />
    );
  }

  return <JugarInner moduleId={moduleId} />;
}

/* ------------------------------------------------------------------ */
/* JugarInner — handles picker phase before game                      */
/* ------------------------------------------------------------------ */

function JugarInner({ moduleId }: { moduleId: ModuleId }) {
  const items = getModuleItems(moduleId)!;
  const quantities = useInventoryStore((s) => s.quantities);

  const hasInventory = Object.values(quantities).some((q) => (q ?? 0) > 0);

  const [gameEffects, setGameEffects] = useState<ActiveEffects | null>(null);

  // Show picker if the player has any powerups and hasn't confirmed yet.
  if (hasInventory && gameEffects === null) {
    return (
      <PowerupPicker
        onConfirm={(activatedIds) => {
          // activatedIds = what was pending just before consumePending ran.
          setGameEffects(buildEffects(activatedIds as import('@/domain/shop/powerups').PowerupId[]));
        }}
      />
    );
  }

  return (
    <GameScreen
      moduleId={moduleId}
      items={items}
      effects={gameEffects ?? undefined}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Error screen                                                        */
/* ------------------------------------------------------------------ */

function ErrorScreen({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <main className="min-h-full flex flex-col items-center justify-center gap-6 p-8 text-center max-w-sm mx-auto">
      <span className="text-6xl" aria-hidden>
        🚧
      </span>
      <p className="text-sm text-white/60 leading-relaxed">{message}</p>
      <Button variant="ghost" onClick={onBack}>
        ← Volver
      </Button>
    </main>
  );
}
