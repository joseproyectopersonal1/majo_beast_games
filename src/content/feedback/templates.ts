/**
 * Feedback template catalogue.
 *
 * Each Item carries a `feedbackTemplateId` string. The game UI looks up the
 * template here to render the hint (shown after a wrong answer) and the
 * encouragement message (shown after a correct answer that follows a wrong one).
 *
 * New modules add their own template IDs; this file is the single registry.
 */

export type FeedbackTemplate = {
  id: string;
  /** Short hint shown immediately after a wrong answer. Max ~60 chars. */
  hint: string;
  /** Positive message shown when the player recovers from a wrong answer. */
  encouragement: string;
};

export const FEEDBACK_TEMPLATES: readonly FeedbackTemplate[] = [
  /* ─── Tablas ────────────────────────────────────────────────────── */
  {
    id: 'tablas.easy',
    hint: 'Repasa las tablas del 2 al 5.',
    encouragement: '¡Bien recuperado!',
  },
  {
    id: 'tablas.medium',
    hint: 'Las tablas del 6 y el 7 necesitan práctica.',
    encouragement: '¡Ya lo tienes!',
  },
  {
    id: 'tablas.hard',
    hint: 'Las del 8 y el 9 son las más difíciles — ¡tú puedes!',
    encouragement: '¡Excelente recuperación!',
  },

  /* ─── Divisiones ─────────────────────────────────────────────────── */
  {
    id: 'divisiones.easy',
    hint: 'Piensa en la tabla del divisor.',
    encouragement: '¡Bien recuperado!',
  },
  {
    id: 'divisiones.medium',
    hint: 'Busca el múltiplo del divisor más cercano al dividendo.',
    encouragement: '¡Ya lo tienes!',
  },
  {
    id: 'divisiones.hard',
    hint: 'Repasa las tablas del 8 y el 9 — la división sale sola.',
    encouragement: '¡Excelente recuperación!',
  },
] as const;

/**
 * Look up a template by id. Returns undefined if the id is not registered
 * (caller's bug — use in dev assertions only).
 */
export function getTemplate(id: string): FeedbackTemplate | undefined {
  return FEEDBACK_TEMPLATES.find((t) => t.id === id);
}

/** All registered template IDs — useful for validation in tests. */
export const TEMPLATE_IDS = new Set(FEEDBACK_TEMPLATES.map((t) => t.id));
