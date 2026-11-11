import { categoryDescendants } from './categories.js';
import { ApiError } from '../api/client.js';
import { text } from '../texts.js';

export const itemField = (id, field) => `items.${id}.${field}`;
export const itemSubtotal = (item) =>
  Math.round(Number(item.unit_price) * 100) * Number(item.quantity);

export function expensePayload(values, items, hasSavedItems) {
  const body = {
    date: values.date,
    description: values.description,
    category_id: Number(values.category_id),
    purchase_channel: values.purchase_channel,
    is_fixed: values.is_fixed === 'on',
  };
  if (values.payment_method_id !== undefined) {
    body.payment_method_id = values.payment_method_id ? Number(values.payment_method_id) : null;
  }

  if (items.length) {
    const issues = [];
    body.expense_items_attributes = items.map((item) => {
      const name = item.name.trim();
      const quantity = Number(item.quantity);
      const unit_price = Number(item.unit_price);
      if (!name) issues.push({ field: itemField(item.id, 'name'), message: text.requiredItemName });
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        issues.push({ field: itemField(item.id, 'quantity'), message: text.invalidItemQuantity });
      }
      if (!item.unit_price || !Number.isFinite(unit_price) || unit_price < 0) {
        issues.push({ field: itemField(item.id, 'unit_price'), message: text.invalidItemPrice });
      }
      return { name, quantity, unit: item.unit, unit_price };
    });
    if (!issues.length && !body.expense_items_attributes.some(({ unit_price }) => unit_price > 0)) {
      issues.push({ field: 'amount', message: text.positiveExpenseTotal });
    }
    if (issues.length) throw new ApiError(422, issues);
  } else if (!hasSavedItems) {
    body.amount = Number(values.amount);
  }
  return body;
}

const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es-AR');

export function filterExpenses(expenses, query, categoryId, categories = []) {
  const ids = categoryId ? categoryDescendants(Number(categoryId), categories) : null;
  const term = normalize(query.trim());
  return expenses.filter((expense) => {
    if (ids && !ids.has(expense.category.id)) return false;
    const searchable = [
      expense.description ?? '',
      expense.category.name,
      ...expense.expense_items.map(({ name }) => name),
    ];
    return !term || searchable.some((value) => normalize(value).includes(term));
  });
}
