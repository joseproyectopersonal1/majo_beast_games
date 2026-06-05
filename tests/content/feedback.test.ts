import { describe, it, expect } from 'vitest';
import {
  FEEDBACK_TEMPLATES,
  TEMPLATE_IDS,
  getTemplate,
} from '@/content/feedback/templates';

describe('feedback templates', () => {
  it('has at least one template per content module in F10', () => {
    const prefixes = ['tablas.', 'divisiones.'];
    for (const prefix of prefixes) {
      const found = FEEDBACK_TEMPLATES.some((t) => t.id.startsWith(prefix));
      expect(found).toBe(true);
    }
  });

  it('no duplicate IDs', () => {
    const ids = FEEDBACK_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('TEMPLATE_IDS set matches the catalogue', () => {
    expect(TEMPLATE_IDS.size).toBe(FEEDBACK_TEMPLATES.length);
    for (const t of FEEDBACK_TEMPLATES) {
      expect(TEMPLATE_IDS.has(t.id)).toBe(true);
    }
  });

  it('getTemplate returns the right template for a known id', () => {
    const t = getTemplate('tablas.easy');
    expect(t).toBeDefined();
    expect(t?.id).toBe('tablas.easy');
  });

  it('getTemplate returns undefined for an unknown id', () => {
    expect(getTemplate('nonexistent.id')).toBeUndefined();
  });

  it('all templates have non-empty hint and encouragement', () => {
    for (const t of FEEDBACK_TEMPLATES) {
      expect(t.hint.trim().length).toBeGreaterThan(0);
      expect(t.encouragement.trim().length).toBeGreaterThan(0);
    }
  });
});
