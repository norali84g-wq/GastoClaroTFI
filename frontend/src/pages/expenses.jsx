import { PaymentMethodField } from '../components/payment-method-field.jsx';
import { useCallback, useState } from 'react';
import {
  CategoryField,
  currentPeriod,
  DataState,
  Field,
  FormError,
  formatMoney,
} from '../components/common.jsx';
import { useAction, useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

function ExpenseForm({ categories, expense, onSaved, onCancel }) {
  const { busy, error, run } = useAction();

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      ...values,
      amount: Number(values.amount),
      category_id: Number(values.category_id),
      ...(values.payment_method_id === undefined
        ? {}
        : {
            payment_method_id: values.payment_method_id ? Number(values.payment_method_id) : null,
          }),
    };
    run(async () => {
      const saved = expense
        ? await api.updateExpense(expense.id, body)
        : await api.createExpense(body);
      onSaved(saved);
    });
  }

  return (
    <section className="panel">
      <h2>{expense ? text.editExpense : text.newExpense}</h2>
      <form onSubmit={submit}>
        <Field
          label={text.date}
          name="date"
          type="date"
          defaultValue={expense?.date}
          error={error}
          required
        />
        <Field
          label={text.amount}
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={expense?.amount}
          error={error}
          required
        />
        <CategoryField
          categories={categories}
          defaultValue={expense?.category?.id ?? ''}
          error={error}
        />
        <Field
          label={text.description}
          name="description"
          defaultValue={expense?.description ?? ''}
          error={error}
        />
        <PaymentMethodField defaultValue={expense?.payment_method_id ?? ''} error={error} />
        <FormError error={error} />
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

export function Expenses() {
  const [period, setPeriod] = useState(currentPeriod);
  const [editor, setEditor] = useState(null);
  const load = useCallback((signal) => api.expenses(period, signal), [period]);
  const expenses = useData(load);
  const categories = useData(api.categories);
  const removal = useAction();

  return (
    <>
      <h1>{text.expenses}</h1>
      <div className="toolbar">
        <Field
          label={text.period}
          type="month"
          value={period}
          onChange={(event) => setPeriod(event.target.value || currentPeriod())}
        />
        <button onClick={() => setEditor({})}>{text.newExpense}</button>
      </div>
      {editor && (
        <DataState result={categories}>
          {(items) => (
            <>
              {!items.length && <p>{text.noCategories}</p>}
              <ExpenseForm
                key={editor.expense?.id ?? 'new'}
                categories={items}
                expense={editor.expense}
                onCancel={() => setEditor(null)}
                onSaved={(saved) => {
                  setEditor(null);
                  setPeriod(saved.date.slice(0, 7));
                  expenses.reload();
                }}
              />
            </>
          )}
        </DataState>
      )}
      <FormError error={removal.error} />
      <DataState result={expenses}>
        {(items) =>
          items.length ? (
            <>
              <p className="muted">{text.expensesLimit}</p>
              <ul className="records">
                {items.map((expense) => (
                  <li className="panel record" key={expense.id}>
                    <div>
                      <strong>{expense.description || expense.category?.name}</strong>
                      <p>
                        {expense.date} · {expense.category?.name}
                      </p>
                      {expense.expense_items?.length > 0 && <small>{text.detailedExpense}</small>}
                    </div>
                    <strong>{formatMoney(expense.amount)}</strong>
                    {!expense.expense_items?.length && (
                      <div className="actions">
                        <button className="secondary" onClick={() => setEditor({ expense })}>
                          {text.edit}
                        </button>
                        <button
                          className="secondary"
                          disabled={removal.busy}
                          onClick={() => {
                            if (window.confirm(text.confirmDelete))
                              removal.run(async () => {
                                await api.removeExpense(expense.id);
                                if (editor?.expense?.id === expense.id) setEditor(null);
                                expenses.reload();
                              });
                          }}
                        >
                          {text.remove}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>{text.empty}</p>
          )
        }
      </DataState>
    </>
  );
}
