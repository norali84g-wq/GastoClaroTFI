import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createClient } from '../src/api/client.js';
import { createResources } from '../src/api/resources.js';

const resources = [
  ['categories', 'Category', { name: 'Verduras', icon: 'verduleria', parent_id: 1 }],
  ['payment_methods', 'PaymentMethod', { name: 'Débito', monthly_fee: 30, icon: 'tarjeta' }],
  ['savings_goals', 'SavingsGoal', { name: 'Viaje', target_amount: 1000 }],
  ['budgets', 'Budget', { period: '2026-11', category_id: 2, amount: 100 }],
  ['incomes', 'Income', { amount: 800, date: '2026-11-08' }],
  [
    'expenses',
    'Expense',
    { description: 'Almuerzo', amount: 100, category_id: 2, date: '2026-11-08' },
  ],
  [
    'installment_purchases',
    'Purchase',
    {
      description: 'Mesa',
      category_id: 2,
      installments_count: 3,
      total_amount: 300,
      first_period: '2026-11',
    },
  ],
  [
    'shopping_list_items',
    'ShoppingItem',
    { name: 'Leche', period: '2026-11', category_id: 2, estimated_unit_price: 40 },
  ],
];

test.each(resources)(
  '%s supports create, edit, delete and preserves 422 errors',
  async (path, method, fields) => {
    const base = `https://example.test/api/v1/${path}`;
    const id = 18;
    const saved = { id, ...fields };
    const issue = { field: 'base', message: 'El registro está en uso' };
    const expected = [
      { url: base, method: 'POST', body: fields, response: Response.json(saved, { status: 201 }) },
      { url: `${base}/${id}`, method: 'PATCH', body: fields, response: Response.json(saved) },
      {
        url: `${base}/${id}`,
        method: 'DELETE',
        response: Response.json({ errors: [issue] }, { status: 422 }),
      },
      { url: `${base}/${id}`, method: 'DELETE', response: new Response(null, { status: 204 }) },
    ];
    const api = createResources(
      createClient({
        baseUrl: 'https://example.test/api/v1',
        getToken: () => 'test-token',
        fetcher: async (url, options) => {
          const request = expected.shift();
          assert.equal(url, request.url);
          assert.equal(options.method, request.method);
          assert.equal(options.headers.Authorization, 'Bearer test-token');
          assert.deepEqual(options.body ? JSON.parse(options.body) : undefined, request.body);
          return request.response;
        },
      }),
    );

    assert.deepEqual(await api[`create${method}`](fields), saved);
    assert.deepEqual(await api[`update${method}`](id, fields), saved);
    await assert.rejects(api[`remove${method}`](id), {
      status: 422,
      message: issue.message,
      issues: [issue],
    });
    assert.equal(await api[`remove${method}`](id), undefined);
    assert.equal(expected.length, 0);
  },
);
