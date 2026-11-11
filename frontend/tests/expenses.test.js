import assert from 'node:assert/strict';
import { test } from 'vitest';
import { expensePayload, filterExpenses, itemSubtotal } from '../src/domain/expenses.js';

const values = {
  date: '2026-11-09',
  description: 'Compra semanal',
  category_id: '2',
  purchase_channel: 'delivery',
  is_fixed: 'on',
  payment_method_id: '7',
  amount: '500.25',
};
const item = { id: 1, name: ' Café ', quantity: '3', unit: 'unidad', unit_price: '4.21' };

test('a simple expense sends the amount and typed fields from the form', () => {
  assert.deepEqual(expensePayload(values, [], false), {
    date: '2026-11-09',
    description: 'Compra semanal',
    category_id: 2,
    purchase_channel: 'delivery',
    is_fixed: true,
    payment_method_id: 7,
    amount: 500.25,
  });
});

test('a new itemized expense leaves the total to Rails and the preview adds integer cents', () => {
  const body = expensePayload(values, [item], false);
  assert.equal(itemSubtotal(item), 1263);
  assert.equal(body.amount, undefined);
  assert.deepEqual(body.expense_items_attributes, [
    { name: 'Café', quantity: 3, unit: 'unidad', unit_price: 4.21 },
  ]);
});

test('item validation stops blank names and fractional quantities before Rails can discard or truncate them', () => {
  assert.throws(
    () => expensePayload(values, [{ ...item, name: ' ', quantity: '1.5' }], false),
    (error) => {
      assert.equal(error.status, 422);
      assert.deepEqual(
        error.issues.map(({ field }) => field),
        ['items.1.name', 'items.1.quantity'],
      );
      return true;
    },
  );
});

test('editing the basic fields of an itemized expense never sends its amount or items', () => {
  const body = expensePayload({ ...values, payment_method_id: '' }, [], true);
  assert.equal(body.payment_method_id, null);
  assert.equal(body.amount, undefined);
  assert.equal(body.expense_items_attributes, undefined);
});

test('expense search folds accents and combines the item and category filters', () => {
  const expense = (id, name) => ({
    category: { id, name },
    description: null,
    expense_items: [{ name: 'Café' }],
  });
  const expenses = [expense(1, 'Alimentación'), expense(2, 'Otros')];
  assert.deepEqual(filterExpenses(expenses, ' CAFE ', '1'), [expenses[0]]);
  assert.deepEqual(filterExpenses(expenses, 'alimentacion', ''), [expenses[0]]);
  assert.deepEqual(filterExpenses(expenses, 'cafe', '3'), []);
});

test('individual free items are valid when the expense total is positive', () => {
  const freeItem = { ...item, id: 2, unit_price: '0' };
  assert.equal(expensePayload(values, [item, freeItem], false).expense_items_attributes.length, 2);
  assert.throws(
    () => expensePayload(values, [freeItem], false),
    (error) => {
      assert.equal(error.issues[0].field, 'amount');
      return true;
    },
  );
});
