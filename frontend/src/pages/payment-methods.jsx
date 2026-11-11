import { useState } from 'react';
import { DataState, Field, FormError, formatMoney } from '../components/common.jsx';
import { useAction, useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

function PaymentMethodForm({ method, onSaved, onCancel }) {
  const { busy, error, run } = useAction();
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = { name: values.name.trim(), monthly_fee: Number(values.monthly_fee) };
    run(async () => {
      if (method) await api.updatePaymentMethod(method.id, body);
      else await api.createPaymentMethod(body);
      onSaved();
    });
  }
  return (
    <section className="panel">
      <h2>{method ? text.editPaymentMethod : text.newPaymentMethod}</h2>
      <form onSubmit={submit}>
        <Field label={text.name} name="name" defaultValue={method?.name} error={error} required />
        <Field
          label={text.monthlyFee}
          name="monthly_fee"
          type="number"
          min="0"
          step="0.01"
          defaultValue={method?.monthly_fee ?? 0}
          error={error}
          required
        />
        <FormError error={error} />
        <div className="actions">
          <button disabled={busy}>{busy ? text.saving : text.save}</button>
          <button className="secondary" type="button" disabled={busy} onClick={onCancel}>
            {text.cancel}
          </button>
        </div>
      </form>
    </section>
  );
}

export function PaymentMethods() {
  const [editor, setEditor] = useState(null);
  const result = useData(api.paymentMethods);
  const removal = useAction();

  return (
    <>
      <h1>{text.paymentMethods}</h1>
      <button onClick={() => setEditor({})}>{text.newPaymentMethod}</button>
      {editor && (
        <PaymentMethodForm
          key={editor.method?.id ?? 'new'}
          method={editor.method}
          onCancel={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            result.reload();
          }}
        />
      )}
      <FormError error={removal.error} />
      <DataState result={result}>
        {(items) =>
          items.length ? (
            <ul className="records">
              {items.map((item) => (
                <li className="panel record" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {text.monthlyFee}: {formatMoney(item.monthly_fee)}
                    </p>
                  </div>
                  <div className="actions">
                    <button className="secondary" onClick={() => setEditor({ method: item })}>
                      {text.edit}
                    </button>
                    <button
                      className="secondary"
                      disabled={removal.busy}
                      onClick={() => {
                        if (window.confirm(text.confirmDelete))
                          removal.run(async () => {
                            await api.removePaymentMethod(item.id);
                            if (editor?.method?.id === item.id) setEditor(null);
                            result.reload();
                          });
                      }}
                    >
                      {text.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>{text.empty}</p>
          )
        }
      </DataState>
    </>
  );
}
