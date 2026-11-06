import { describe, expect, it } from 'vitest';
import { tipIndex } from './tips';

describe('tipIndex', () => {
  it('cambia de un día al siguiente y vuelve a empezar al terminar la lista', () => {
    const a = tipIndex(new Date('2026-11-04T12:00:00Z'), 5);
    const b = tipIndex(new Date('2026-11-05T12:00:00Z'), 5);
    expect(b).toBe((a + 1) % 5);
  });

  it('con una lista vacía devuelve 0', () => {
    expect(tipIndex(new Date('2026-11-04T12:00:00Z'), 0)).toBe(0);
  });
});
