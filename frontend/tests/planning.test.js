import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createResources } from '../src/api/resources.js';
import { shiftPeriod } from '../src/domain/periods.js';

test('period shifts keep the year and month in ISO form across year boundaries', () => {
  assert.equal(shiftPeriod('2026-12', 1), '2027-01');
  assert.equal(shiftPeriod('2027-01', -1), '2026-12');
});

test('monthly resources send the documented query parameters', () => {
  const api = createResources((path, options) => ({
    url: new URL(path, 'https://example.test'),
    ...options,
  }));
  const signal = new AbortController().signal;
  const reads = [
    [api.shoppingItems('2026-11', signal), '/shopping_list_items', { period: '2026-11' }],
    [
      api.monthlyComparison('2026-10', '2026-11', signal),
      '/statistics/monthly_comparison',
      { from: '2026-10', to: '2026-11' },
    ],
    [api.statistics('2026', '', signal), '/statistics', { year: '2026' }],
    [api.statistics('2026', '11', signal), '/statistics', { year: '2026', month: '11' }],
  ];
  for (const [read, path, query] of reads) {
    assert.equal(read.url.pathname, path);
    assert.deepEqual(Object.fromEntries(read.url.searchParams), query);
    assert.equal(read.signal, signal);
  }
});

test('shopping copy and checkbox write the exact contract body', () => {
  const api = createResources((path, options) => ({ path, ...options }));
  assert.deepEqual(api.copyShoppingItems('2026-12', '2027-01'), {
    path: '/shopping_list_items/copy',
    method: 'POST',
    body: { from_period: '2026-12', to_period: '2027-01' },
  });
  assert.deepEqual(api.updateShoppingItem(7, { purchased: false }), {
    path: '/shopping_list_items/7',
    method: 'PATCH',
    body: { purchased: false },
  });
});
