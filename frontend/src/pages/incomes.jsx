import { DeleteRecord, useDeleteRecord } from '../components/delete-record.jsx';
import { Status } from '../components/chanchito.jsx';
import { useContext, useState } from 'react';
import {
  currentDate,
  currentPeriod,
  DataState,
  Field,
  FormError,
  formatMoney,
} from '../components/common.jsx';
import { useAction, useData } from '../hooks/data.js';
import { AccountContext, api } from '../hooks/session.js';
import { text } from '../texts.js';

function IncomeForm({ income, date, onSaved, onCancel }) {
  const { busy, error, run } = useAction();

  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const body = { date: values.get('date'), amount: Number(values.get('amount')) };
    run(async () => {
      const saved = income ? await api.updateIncome(income.id, body) : await api.createIncome(body);
      onSaved(saved);
    });
  }

  return (
    <section className="panel movement-editor">
      <h2>{income ? text.editIncome : text.newIncome}</h2>
      <form onSubmit={submit} aria-busy={busy}>
        <Field
          label={text.date}
          name="date"
          type="date"
          defaultValue={income?.date ?? date}
          error={error}
          required
        />
        <Field
          label={text.amount}
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={income?.amount}
          error={error}
          required
        />
        <FormError retrySubmit error={error} fieldNames={['date', 'amount']} />
        <div className="actions">
          <button disabled={busy}>{busy ? text.saving : text.save}</button>
          <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
            {text.cancel}
          </button>
        </div>
      </form>
    </section>
  );
}

export function Incomes({ initialEditor = false }) {
  const [period, setPeriod] = useState(currentPeriod);
  const [editor, setEditor] = useState(() => (initialEditor ? {} : null));
  const { admin } = useContext(AccountContext);
  const result = useData(api.incomes);
  const deletion = useDeleteRecord(api.removeIncome, result.reload);

  function saved(record) {
    setEditor(null);
    setPeriod(record.date.slice(0, 7));
    result.reload();
  }

  return (
    <>
      <h1>{text.incomes}</h1>
      <div className="toolbar">
        <Field
          label={text.period}
          type="month"
          disabled={Boolean(editor) || deletion.busy}
          value={period}
          onChange={(event) => setPeriod(event.target.value || currentPeriod())}
        />
        <button
          type="button"
          disabled={Boolean(editor) || deletion.busy}
          onClick={() => setEditor({})}
        >
          {text.newIncome}
        </button>
      </div>
      {editor && (
        <IncomeForm
          key={editor.income?.id ?? 'new'}
          income={editor.income}
          date={period === currentPeriod() ? currentDate() : `${period}-01`}
          onSaved={saved}
          onCancel={() => setEditor(null)}
        />
      )}
      <DeleteRecord action={deletion} />
      <DataState result={result}>
        {(items) => {
          const incomes = items.filter(({ date }) => date.startsWith(`${period}-`));
          const cents = incomes.reduce(
            (sum, { amount }) => sum + Math.round(Number(amount) * 100),
            0,
          );
          return (
            <>
              <div className="panel movement-total">
                <span>{text.incomeTotal}</span>
                <strong className="movement-amount">{formatMoney(cents / 100)}</strong>
              </div>
              {incomes.length ? (
                <ul className="records movement-records">
                  {incomes.map((income) => (
                    <li className="panel record" key={income.id}>
                      <div>
                        <time dateTime={income.date}>{income.date}</time>
                        {admin && <p>{income.user.user}</p>}
                      </div>
                      <strong>{formatMoney(income.amount)}</strong>
                      <div className="actions">
                        <button
                          type="button"
                          className="secondary"
                          disabled={Boolean(editor) || deletion.busy}
                          onClick={() => setEditor({ income })}
                        >
                          {text.edit}
                        </button>
                        <button
                          type="button"
                          className="movement-danger"
                          disabled={Boolean(editor) || deletion.busy}
                          onClick={() => deletion.ask(income, formatMoney(income.amount))}
                        >
                          {text.remove}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Status message={text.noMonthlyIncomes} />
              )}
            </>
          );
        }}
      </DataState>
    </>
  );
}
