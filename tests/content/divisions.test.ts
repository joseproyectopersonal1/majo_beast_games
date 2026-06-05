import { describe, it, expect } from 'vitest';
import { DIVISIONS_ITEMS } from '@/content/divisions/items';
import { TEMPLATE_IDS } from '@/content/feedback/templates';

const ID_RE = /^divisiones\.div\.(\d+)by(\d+)$/;

describe('divisiones content', () => {
  it('has exactly 64 items', () => {
    expect(DIVISIONS_ITEMS).toHaveLength(64);
  });

  it('all IDs match the divisiones.div.{dividend}by{divisor} convention', () => {
    for (const item of DIVISIONS_ITEMS) {
      expect(item.id).toMatch(ID_RE);
    }
  });

  it('no duplicate IDs', () => {
    const ids = DIVISIONS_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all items belong to moduleId "divisiones"', () => {
    for (const item of DIVISIONS_ITEMS) {
      expect(item.moduleId).toBe('divisiones');
    }
  });

  it('all answers are numeric and equal dividend ÷ divisor', () => {
    for (const item of DIVISIONS_ITEMS) {
      const m = ID_RE.exec(item.id);
      expect(m).not.toBeNull();
      const dividend = Number(m![1]);
      const divisor = Number(m![2]);
      expect(item.answer.type).toBe('numeric');
      if (item.answer.type === 'numeric') {
        expect(item.answer.value).toBe(dividend / divisor);
        // Verify it's an exact integer division.
        expect(Number.isInteger(item.answer.value)).toBe(true);
      }
    }
  });

  it('all prompts are arithmetic with op "÷"', () => {
    for (const item of DIVISIONS_ITEMS) {
      expect(item.prompt.type).toBe('arithmetic');
      if (item.prompt.type === 'arithmetic') {
        expect(item.prompt.op).toBe('÷');
      }
    }
  });

  it('difficulty is always 1, 2, or 3', () => {
    for (const item of DIVISIONS_ITEMS) {
      expect([1, 2, 3]).toContain(item.difficulty);
    }
  });

  it('divisions with divisor ≤ 5 are difficulty 1', () => {
    const easy = DIVISIONS_ITEMS.filter((i) => {
      const m = ID_RE.exec(i.id)!;
      return Number(m[2]) <= 5;
    });
    for (const item of easy) {
      expect(item.difficulty).toBe(1);
    }
  });

  it('divisions with divisor ≥ 8 are difficulty 3', () => {
    const hard = DIVISIONS_ITEMS.filter((i) => {
      const m = ID_RE.exec(i.id)!;
      return Number(m[2]) >= 8;
    });
    for (const item of hard) {
      expect(item.difficulty).toBe(3);
    }
  });

  it('all feedbackTemplateIds reference a registered template', () => {
    for (const item of DIVISIONS_ITEMS) {
      expect(TEMPLATE_IDS.has(item.feedbackTemplateId)).toBe(true);
    }
  });

  it('all quotients are in the range 2..9', () => {
    for (const item of DIVISIONS_ITEMS) {
      if (item.answer.type === 'numeric') {
        expect(item.answer.value).toBeGreaterThanOrEqual(2);
        expect(item.answer.value).toBeLessThanOrEqual(9);
      }
    }
  });

  it('all dividends are in the range 4..81 (products of factors 2..9)', () => {
    for (const item of DIVISIONS_ITEMS) {
      const m = ID_RE.exec(item.id)!;
      const dividend = Number(m[1]);
      expect(dividend).toBeGreaterThanOrEqual(4);   // 2×2
      expect(dividend).toBeLessThanOrEqual(81);      // 9×9
    }
  });
});
