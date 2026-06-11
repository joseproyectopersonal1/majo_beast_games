/**
 * Achievement catalog — closed set of 18 unlockable achievements.
 *
 * Source of truth: tasks_for_AI/T05 §F27.
 *
 * IDs form a union type for compile-time exhaustiveness.
 * Pure data — no I/O, no React.
 */

export type AchievementId =
  | 'primer-acierto'
  | 'racha-5'
  | 'racha-10'
  | 'racha-20'
  | 'primer-modulo-dominado'
  | 'todos-modulos-jugados'
  | 'primera-compra'
  | 'coleccionista'
  | 'primer-reto'
  | 'giro-bestial'
  | 'dias-7'
  | 'dias-30'
  | 'monedas-1000'
  | 'monedas-10000'
  | 'jefe-derrotado'
  | 'jefe-perfecto'
  | 'debilidad-superada'
  | 'sin-debilidades';

export type Achievement = {
  readonly id: AchievementId;
  readonly name: string;
  readonly emoji: string;
  readonly description: string;
  /** Category for grouping in the UI. */
  readonly category: 'juego' | 'progreso' | 'tienda' | 'ruleta';
};

export const ACHIEVEMENTS: readonly Achievement[] = [
  // Juego
  {
    id: 'primer-acierto',
    name: 'Primera victoria',
    emoji: '⭐',
    description: 'Responde correctamente por primera vez.',
    category: 'juego',
  },
  {
    id: 'racha-5',
    name: 'En racha',
    emoji: '🔥',
    description: 'Consigue una racha de 5 respuestas correctas.',
    category: 'juego',
  },
  {
    id: 'racha-10',
    name: 'Imparable',
    emoji: '⚡',
    description: 'Consigue una racha de 10 respuestas correctas.',
    category: 'juego',
  },
  {
    id: 'racha-20',
    name: 'Bestia de las mates',
    emoji: '🦁',
    description: 'Consigue una racha de 20 respuestas correctas.',
    category: 'juego',
  },
  {
    id: 'jefe-derrotado',
    name: 'Cazajefes',
    emoji: '👊',
    description: 'Completa el modo Jefe Final.',
    category: 'juego',
  },
  {
    id: 'jefe-perfecto',
    name: 'Perfección total',
    emoji: '💎',
    description: 'Completa el Jefe Final con 10/10 correctas.',
    category: 'juego',
  },

  // Progreso
  {
    id: 'primer-modulo-dominado',
    name: 'Maestra',
    emoji: '🎓',
    description: 'Domina el 100% de un módulo.',
    category: 'progreso',
  },
  {
    id: 'todos-modulos-jugados',
    name: 'Exploradora',
    emoji: '🗺️',
    description: 'Juega al menos una vez cada módulo.',
    category: 'progreso',
  },
  {
    id: 'debilidad-superada',
    name: 'Superación',
    emoji: '🎯',
    description: 'Supera tu primera debilidad.',
    category: 'progreso',
  },
  {
    id: 'sin-debilidades',
    name: 'Invencible',
    emoji: '🛡️',
    description: 'Cero frágiles en un módulo con 10+ ejercicios vistos.',
    category: 'progreso',
  },
  {
    id: 'dias-7',
    name: 'Constancia',
    emoji: '📅',
    description: 'Racha de 7 días jugando.',
    category: 'progreso',
  },
  {
    id: 'dias-30',
    name: 'Leyenda',
    emoji: '👑',
    description: 'Racha de 30 días jugando.',
    category: 'progreso',
  },

  // Tienda
  {
    id: 'primera-compra',
    name: 'Primera compra',
    emoji: '🛒',
    description: 'Compra tu primera ventaja en la tienda.',
    category: 'tienda',
  },
  {
    id: 'coleccionista',
    name: 'Coleccionista',
    emoji: '📦',
    description: 'Ten 5 o más ventajas en tu inventario.',
    category: 'tienda',
  },
  {
    id: 'monedas-1000',
    name: 'Ahorradora',
    emoji: '🪙',
    description: 'Acumula 1.000 monedas.',
    category: 'tienda',
  },
  {
    id: 'monedas-10000',
    name: 'Millonaria',
    emoji: '💰',
    description: 'Acumula 10.000 monedas.',
    category: 'tienda',
  },

  // Ruleta
  {
    id: 'primer-reto',
    name: 'Retadora',
    emoji: '❓',
    description: 'Completa un reto de la ruleta.',
    category: 'ruleta',
  },
  {
    id: 'giro-bestial',
    name: '¡BESTIAL!',
    emoji: '🏆',
    description: 'Obtén el premio BESTIAL en la ruleta.',
    category: 'ruleta',
  },
] as const;

/** Lookup by id. Throws on unknown id (defensive). */
export function achievementById(id: AchievementId): Achievement {
  const found = ACHIEVEMENTS.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown achievement id: "${id}"`);
  return found;
}

/** All achievement IDs for iteration. */
export const ACHIEVEMENT_IDS: readonly AchievementId[] = ACHIEVEMENTS.map((a) => a.id);
