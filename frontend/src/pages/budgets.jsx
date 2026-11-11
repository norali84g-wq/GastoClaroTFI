import { DeleteRecord, useDeleteRecord } from '../components/delete-record.jsx';
import { CategoriaIcono } from '../components/categoria-icono.jsx';
import { BudgetAlert, useMonthAlerts } from '../components/budget-alerts.jsx';
import { Status } from '../components/chanchito.jsx';
import { useCallback, useState } from 'react';
import {
  CategoryField,
  currentPeriod,
  DataState,
  Field,
  FormError,
  formatMoney,
} from '../components/common.jsx';
import { EditorActions, MonthPicker, Progress, RecordActions } from '../components/planning.jsx';
import { useAction, useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

function BudgetForm({ categories, period, item, onSaved, onCancel }) {
  const { busy, error, run } = useAction();

  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const body = {
      period: values.get('period'),
      category_id: Number(values.get('category_id')),
      amount: Number(values.get('amount')),
    };
    run(async () => {
      const saved = item ? await api.updateBudget(item.id, body) : await api.createBudget(body);
      onSaved(saved);
    });
  }

  return (
    <section className="panel movement-editor">
      <h2>{item ? text.editBudget : text.newBudget}</h2>
      <form onSubmit={submit}>
        <Field
          label={text.period}
          name="period"
          type="month"
          defaultValue={item?.period ?? period}
          error={error}
          required
        />
        <CategoryField
          grouped
          allowParents
          categories={categories}
          defaultValue={item?.category.id}
          error={error}
        />
        <Field
          label={text.amount}
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={item?.amount}
          error={error}
          required
        />
        <FormError retrySubmit error={error} fieldNames={['period', 'category_id', 'amount']} />
        <EditorActions busy={busy} blocked={!categories.length} onCancel={onCancel} />
      </form>
    </section>
  );
}

export function Budgets({ initialPeriod }) {
  const [period, setPeriod] = useState(() => initialPeriod ?? currentPeriod());
  const [editor, setEditor] = useState(null);
  const loadBudgets = useCallback((signal) => api.budgets(period, signal), [period]);
  const budgets = useData(loadBudgets);
  const alerts = useMonthAlerts(period);
  const categories = useData(api.categories);
  const deletion = useDeleteRecord(api.removeBudget, refresh);
  const disabled = Boolean(editor) || deletion.busy;

  function refresh() {
    budgets.reload();
    alerts.reload();
  }

  return (
    <>
      <h1>{text.budgets}</h1>
      <div className="toolbar">
        <MonthPicker period={period} onChange={setPeriod} disabled={disabled} />
        <button type="button" disabled={disabled} onClick={() => setEditor({})}>
          {text.newBudget}
        </button>
      </div>
      {editor && (
        <DataState result={categories}>
          {(items) => (
            <BudgetForm
              key={editor.item?.id ?? 'new'}
              categories={items}
              period={period}
              item={editor.item}
              onCancel={() => setEditor(null)}
              onSaved={(saved) => {
                setEditor(null);
                setPeriod(saved.period);
                refresh();
              }}
            />
          )}
        </DataState>
      )}
      {editor && (categories.error || categories.loading) && (
        <button className="secondary" type="button" onClick={() => setEditor(null)}>
          {text.cancel}
        </button>
      )}
      <DeleteRecord action={deletion} />
      <DataState result={budgets}>
        {(items) =>
          items.length ? (
            <ul className="records planning-grid">
              {items.map((item) => (
                <li className="panel planning-card" key={item.id}>
                  <div className="gc-category-heading">
                    <CategoriaIcono nombre={item.category.name} id={item.category.id} size={44} />
                    <h2>{item.category.name}</h2>
                  </div>
                  <p>
                    {text.spent} · {formatMoney(item.spent)} / {formatMoney(item.amount)}
                  </p>
                  <p>
                    {text.available} · {formatMoney(item.remaining)}
                  </p>
                  <Progress
                    label={text.budgetProgress(item.category.name)}
                    percentage={item.percentage}
                  />
                  <DataState result={alerts}>
                    {(records) =>
                      records
                        .filter((alert) => alert.budget.id === item.id)
                        .map((alert) => <BudgetAlert alert={alert} key={alert.id} />)
                    }
                  </DataState>
                  <RecordActions
                    disabled={disabled}
                    onEdit={() => setEditor({ item })}
                    onRemove={() => deletion.ask(item, item.category.name)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Status message={text.noMonthlyBudgets} />
          )
        }
      </DataState>
    </>
  );
}
