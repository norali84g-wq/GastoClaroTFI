import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
  categoryDescendants,
  categoryChoices,
  categoryTree,
  groupStatisticsCategories,
} from '../src/domain/categories.js';

const categories = [
  { id: 3, parent_id: 2, name: 'Nafta' },
  { id: 1, parent_id: null, name: 'Transporte' },
  { id: 2, parent_id: 1, name: 'Auto' },
  { id: 4, parent_id: 1, name: 'Tren' },
  { id: 5, parent_id: null, name: 'Luz' },
];

test('builds the hierarchy regardless of order and groups only terminal expense options', () => {
  const [transport, light] = categoryTree(categories);
  assert.equal(transport.children.length, 2);
  assert.equal(light.children.length, 0);
  assert.deepEqual(categoryChoices(transport.children), [
    { id: 3, label: 'Auto › Nafta' },
    { id: 4, label: 'Tren' },
  ]);
  assert.equal(categoryChoices(transport.children, true)[0].branch, true);
  assert.deepEqual([...categoryDescendants(1, categories)].sort(), [1, 2, 3, 4]);
});

test('statistics roll intermediate groups into the root without adding nested details twice', () => {
  const result = groupStatisticsCategories(
    [
      {
        category: { id: 2, name: 'Auto' },
        total: '10.25',
        percentage: 20,
        subcategories: [{ real: '10.25' }],
      },
      { category: { id: 1, name: 'Transporte' }, total: '15.75', percentage: 30 },
      { category: { id: 5, name: 'Luz' }, total: '10', percentage: 19 },
    ],
    categories,
  );
  assert.deepEqual(result, [
    { category_id: 1, category: 'Transporte', total: 26, reportedPercentage: 50 },
    { category_id: 5, category: 'Luz', total: 10, reportedPercentage: 19 },
  ]);
});
