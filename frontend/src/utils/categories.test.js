import { orderAsTree } from './categories';

function category(id, name, parentId = null) {
  return { id, name, parentId };
}

describe('categorías ordenadas como árbol', () => {
  it('pone cada subcategoría justo debajo de su categoría principal', () => {
    const ordered = orderAsTree([
      category(3, 'Visa', 1),
      category(2, 'Servicios'),
      category(1, 'Tarjetas'),
      category(4, 'Mastercard', 1),
    ]);

    expect(ordered.map(({ name }) => name)).toEqual([
      'Servicios',
      'Tarjetas',
      'Mastercard',
      'Visa',
    ]);
  });

  it('una subcategoría cuya principal no está en la lista no desaparece', () => {
    const ordered = orderAsTree([category(5, 'Huérfana', 99), category(1, 'Comida')]);

    expect(ordered.map(({ name }) => name)).toEqual(['Comida', 'Huérfana']);
  });
});
