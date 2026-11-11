import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'vitest';
import { catalogoIconos, esClaveIcono, iconoPorNombre } from '../src/domain/icons.js';

test.each([
  ['NAFTA', 'nafta'],
  ['Factura de LÚZ', 'luz'],
  ['Leche descremada', 'supermercado'],
  ['Pan integral', 'panaderia'],
  ['Alimento para mascotas', 'mascotas'],
  ['Teléfono celular', 'celular'],
  ['Tarjeta azul', 'tarjeta-azul'],
  ['BILLÉTERA virtual', 'efectivo'],
  ['Panorama', 'otros'],
  [null, 'otros'],
])('matches %s to %s', (name, expected) => {
  assert.equal(iconoPorNombre(name), expected);
});

test('every icon key has exactly one light 128px transparent WebP', () => {
  const directory = new URL('../public/iconos/', import.meta.url);
  const keys = catalogoIconos.map(({ clave }) => clave);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(esClaveIcono('../unexpected'), false);
  assert.ok(keys.length >= 60);
  assert.deepEqual(readdirSync(directory).sort(), keys.map((key) => `${key}.webp`).sort());
  for (const key of keys) {
    const image = readFileSync(new URL(`${key}.webp`, directory));
    assert.ok(image.length < 10000, key);
    assert.equal(image.toString('ascii', 8, 16), 'WEBPVP8X', key);
    assert.ok(image[20] & 0x10, key);
    assert.equal(image.readUIntLE(24, 3) + 1, 128, key);
    assert.equal(image.readUIntLE(27, 3) + 1, 128, key);
  }
});
