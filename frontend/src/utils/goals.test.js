import { describe, expect, it } from 'vitest';
import { goalScene } from './goals';

describe('goalScene', () => {
  it('reconoce la escena por el nombre de la meta', () => {
    expect(goalScene({ id: 1, name: 'Mi primera casa' })).toBe('house');
    expect(goalScene({ id: 2, name: 'Vacaciones en el mar' })).toBe('sea');
    expect(goalScene({ id: 3, name: 'Viaje a la Patagonia' })).toBe('mountain');
  });

  it('reconoce metas de auto, notebook, celular, bici, estudio, emergencia y regalo', () => {
    expect(goalScene({ id: 1, name: 'Auto' })).toBe('car');
    expect(goalScene({ id: 2, name: 'Notebook' })).toBe('laptop');
    expect(goalScene({ id: 3, name: 'Celular nuevo' })).toBe('phone');
    expect(goalScene({ id: 4, name: 'Bicicleta' })).toBe('bike');
    expect(goalScene({ id: 5, name: 'Curso de inglés' })).toBe('study');
    expect(goalScene({ id: 6, name: 'Fondo de emergencia' })).toBe('shield');
    expect(goalScene({ id: 7, name: 'Regalo de cumpleaños' })).toBe('gift');
  });

  it('si no reconoce el nombre, reparte por id', () => {
    expect(goalScene({ id: 0, name: 'Mis ahorros' })).toBe('mountain');
    expect(goalScene({ id: 1, name: 'Mis ahorros' })).toBe('sea');
    expect(goalScene({ id: 2, name: 'Mis ahorros' })).toBe('house');
  });
});
