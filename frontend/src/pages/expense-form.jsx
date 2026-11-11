import { ProductIcon } from '../components/icono.jsx';
import { useRef, useState } from 'react';
import { PaymentMethodField } from '../components/payment-method-field.jsx';
import {
  CategoryField,
  currentDate,
  Field,
  FormError,
  formatMoney,
} from '../components/common.jsx';
import { expensePayload, itemField, itemSubtotal } from '../domain/expenses.js';
import { useAction } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

const fields = [
  'date',
  'amount',
  'description',
  'category_id',
  'purchase_channel',
  'is_fixed',
  'payment_method_id',
];
const itemFields = ['name', 'quantity', 'unit', 'unit_price'];

function ItemEditor({ item, number, error, update, remove, disabled }) {
  const field = (name) => ({
    name: itemField(item.id, name),
    value: item[name],
    onChange: (event) => update(name, event.target.value),
    error,
    required: true,
  });

  return (
    <fieldset className="movement-item">
      <legend>{text.expenseItem(number)}</legend>
      {item.name.trim() && <ProductIcon name={item.name} />}
      <Field label={text.itemName} {...field('name')} />
      <div className="movement-field-grid">
        <Field label={text.itemQuantity} type="number" min="1" step="1" {...field('quantity')} />
        <Field label={text.itemUnit} {...field('unit')}>
          {Object.entries(text.itemUnits).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Field>
      </div>
      <Field label={text.unitPrice} type="number" min="0" step="0.01" {...field('unit_price')} />
      <div className="movement-actions">
        <span>
          {text.subtotal} <strong>{formatMoney(itemSubtotal(item) / 100)}</strong>
        </span>
        <button className="secondary" type="button" disabled={disabled} onClick={remove}>
          {text.removeExpenseItem(number)}
        </button>
      </div>
    </fieldset>
  );
}

export function ExpenseForm({ categories, expense, onSaved, onCancel, defaultDate }) {
  const { busy, error, run } = useAction();
  const [items, setItems] = useState([]);
  const nextId = useRef(0);
  const [amount, setAmount] = useState(expense?.amount ?? '');
  const hasSavedItems = Boolean(expense?.expense_items.length);
  const calculatedAmount = hasSavedItems || items.length > 0;
  const amountIssue = error?.issues?.find(({ field }) => field === 'amount');
  const total = hasSavedItems
    ? expense.amount
    : items.reduce((sum, item) => sum + itemSubtotal(item), 0) / 100;

  function addItem() {
    const id = nextId.current++;
    setItems((current) => [
      ...current,
      { id, name: '', quantity: '1', unit: 'unidad', unit_price: '' },
    ]);
  }

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      const body = expensePayload(values, items, hasSavedItems);
      const saved = expense
        ? await api.updateExpense(expense.id, body)
        : await api.createExpense(body);
      onSaved(saved);
    });
  }

  return (
    <section className="panel movement-editor">
      <form onSubmit={submit} aria-busy={busy}>
        <Field
          label={text.date}
          name="date"
          type="date"
          defaultValue={expense?.date ?? defaultDate ?? currentDate()}
          error={error}
          required
        />
        <Field
          label={text.description}
          name="description"
          defaultValue={expense?.description ?? ''}
          error={error}
        />
        <CategoryField
          grouped
          categories={categories}
          defaultValue={expense?.category.id}
          error={error}
        />
        <Field
          label={text.purchaseChannel}
          name="purchase_channel"
          defaultValue={expense?.purchase_channel ?? 'presencial'}
          error={error}
          required
        >
          {Object.entries(text.purchaseChannels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Field>
        <Field
          className="movement-checkbox"
          label={text.fixedExpense}
          type="checkbox"
          name="is_fixed"
          defaultChecked={expense?.is_fixed ?? false}
          error={error}
        />
        <PaymentMethodField
          defaultValue={expense?.payment_method_id ?? ''}
          error={error}
          keepCurrent
        />
        {calculatedAmount ? (
          <div>
            <p className="movement-total">
              {text.expenseTotal} <output>{formatMoney(total)}</output>
            </p>
            {amountIssue && (
              <p role="alert" className="field-error">
                {amountIssue.message}
              </p>
            )}
          </div>
        ) : (
          <Field
            label={text.amount}
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={error}
            required
          />
        )}
        {!expense && (
          <section className="movement-items" aria-label={text.expenseItems}>
            {items.map((item, index) => (
              <ItemEditor
                key={item.id}
                item={item}
                number={index + 1}
                error={error}
                disabled={busy}
                update={(name, value) =>
                  setItems((current) =>
                    current.map((row) => (row.id === item.id ? { ...row, [name]: value } : row)),
                  )
                }
                remove={() => setItems((current) => current.filter((row) => row.id !== item.id))}
              />
            ))}
            <button type="button" className="secondary" onClick={addItem} disabled={busy}>
              {text.addExpenseItem}
            </button>
          </section>
        )}
        <FormError
          retrySubmit
          error={error}
          fieldNames={[
            ...fields,
            ...items.flatMap(({ id }) => itemFields.map((field) => itemField(id, field))),
          ]}
        />
        <div className="actions">
          <button disabled={busy || !categories.length}>{busy ? text.saving : text.save}</button>
          <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
            {text.cancel}
          </button>
        </div>
      </form>
    </section>
  );
}
