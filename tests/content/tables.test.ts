import { describe, it, expect } from 'vitest';
import { TABLES_ITEMS } from '@/content/tables/items';
import { TEMPLATE_IDS } from '@/content/feedback/templates';

const ID_RE = /^tablas\.mult\.(\d+)x(\d+)$/;

describe('tablas content', () => {
  it('has exactly 64 items (2×2 through 9×9)', () => {
    expect(TABLES_ITEMS).toHaveLength(64);
  });

  it('all IDs match the tablas.mult.AxB convention', () => {
    for (const item of TABLES_ITEMS) {
      expect(item.id).toMatch(ID_RE);
    }
  });

  it('no duplicate IDs', () => {
    const ids = TABLES_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all items belong to moduleId "tablas"', () => {
    for (const item of TABLES_ITEMS) {
      expect(item.moduleId).toBe('tablas');
    }
  });

  it('all answers are numeric and equal a×b', () => {
    for (const item of TABLES_ITEMS) {
      const m = ID_RE.exec(item.id);
      expect(m).not.toBeNull();
      const a = Number(m![1]);
      const b = Number(m![2]);
      expect(item.answer.type).toBe('numeric');
      if (item.answer.type === 'numeric') {
        expect(item.answer.value).toBe(a * b);
      }
    }
  });

  it('all prompts are arithmetic with op "×"', () => {
    for (const item of TABLES_ITEMS) {
      expect(item.prompt.type).toBe('arithmetic');
      if (item.prompt.type === 'arithmetic') {
        expect(item.prompt.op).toBe('×');
      }
    }
  });

  it('difficulty is always 1, 2, or 3', () => {
    for (const item of TABLES_ITEMS) {
      expect([1, 2, 3]).toContain(item.difficulty);
    }
  });

  it('2×2 through 5×5 are difficulty 1', () => {
    for (let a = 2; a <= 5; a++) {
      for (let b = 2; b <= 5; b++) {
        const item = TABLES_ITEMS.find((i) => i.id === `tablas.mult.${a}x${b}`);
        expect(item?.difficulty).toBe(1);
      }
    }
  });

  it('items with both factors ≥ 6 are difficulty 3', () => {
    for (let a = 6; a <= 9; a++) {
      for (let b = 6; b <= 9; b++) {
        const item = TABLES_ITEMS.find((i) => i.id === `tablas.mult.${a}x${b}`);
        expect(item?.difficulty).toBe(3);
      }
    }
  });

  it('all feedbackTemplateIds reference a registered template', () => {
    for (const item of TABLES_ITEMS) {
      expect(TEMPLATE_IDS.has(item.feedbackTemplateId)).toBe(true);
    }
  });

  it('covers all factors from 2 to 9 in both positions', () => {
    const asFactors = new Set(
      TABLES_ITEMS.flatMap((i) => {
        const m = ID_RE.exec(i.id)!;
        return [Number(m[1]), Number(m[2])];
      }),
    );
    for (let n = 2; n <= 9; n++) {
      expect(asFactors.has(n)).toBe(true);
    }
  });
});
