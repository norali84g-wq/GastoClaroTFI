import { DeleteRecord, useDeleteRecord } from '../components/delete-record.jsx';
import { SelectorIcono } from '../components/selector-icono.jsx';
import { iconoPorNombre } from '../domain/icons.js';
import { useIconPreferences } from '../hooks/icon-preferences.jsx';
import { TarjetaIcono } from '../components/tarjeta-icono.jsx';
import { Status } from '../components/chanchito.jsx';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { DataState, Field, FormError, formatMoney } from '../components/common.jsx';
import { useAction, useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

function PaymentMethodForm({ method, onSaved, onCancel }) {
  const { busy, error, run } = useAction();
  const { paymentIcons } = useIconPreferences();
  const [name, setName] = useState(method?.name ?? '');
  const [icon, setIcon] = useState(() => (method ? paymentIcons.selected(method) : ''));
  const automatic = iconoPorNombre(name);
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      name: name.trim(),
      monthly_fee: Number(values.monthly_fee),
      icon: icon || automatic,
    };
    run(async () => {
      const saved = method
        ? await api.updatePaymentMethod(method.id, body)
        : await api.createPaymentMethod(body);
      const local = paymentIcons.remember(saved, icon);
      onSaved(local && Boolean(icon));
    });
  }
  return (
    <section className="panel">
      <h2>{method ? text.editPaymentMethod : text.newPaymentMethod}</h2>
      <form onSubmit={submit}>
        <Field
          label={text.name}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={error}
          required
        />
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
        <SelectorIcono
          valor={icon}
          onChange={setIcon}
          automatico={automatic}
          error={error}
          disabled={busy}
        />
        <FormError retrySubmit error={error} fieldNames={['name', 'monthly_fee', 'icon']} />
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
  const [notice, setNotice] = useState(false);
  const result = useData(api.paymentMethods);
  const { paymentIcons } = useIconPreferences();
  const deletion = useDeleteRecord(api.removePaymentMethod, (item) => {
    paymentIcons.remember(item, '');
    setNotice(false);
    result.reload();
  });

  return (
    <>
      <h1>{text.paymentMethods}</h1>
      <div className="actions">
        <button
          type="button"
          disabled={Boolean(editor) || deletion.busy}
          onClick={() => setEditor({})}
        >
          {text.newPaymentMethod}
        </button>
        <Link className="button secondary" to="/cuotas">
          {text.viewInstallments}
        </Link>
      </div>
      {editor && (
        <PaymentMethodForm
          key={editor.method?.id ?? 'new'}
          method={editor.method}
          onCancel={() => setEditor(null)}
          onSaved={(local) => {
            setNotice(local);
            setEditor(null);
            result.reload();
          }}
        />
      )}
      {notice && <p role="status">{text.iconSavedLocally}</p>}
      <DeleteRecord action={deletion} />
      <DataState result={result}>
        {(items) =>
          items.length ? (
            <ul className="records planning-grid gc-payment-methods">
              {items.map((item) => (
                <li className="panel gc-payment-card" key={item.id}>
                  <div className="gc-payment-heading">
                    <TarjetaIcono medio={item} />
                    <div>
                      <h2>{item.name}</h2>
                      <p>
                        {text.monthlyFee}: {formatMoney(item.monthly_fee)}
                      </p>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="secondary"
                      disabled={Boolean(editor) || deletion.busy}
                      onClick={() => setEditor({ method: item })}
                    >
                      {text.edit}
                    </button>
                    <button
                      className="movement-danger"
                      disabled={Boolean(editor) || deletion.busy}
                      onClick={() => deletion.ask(item, item.name)}
                    >
                      {text.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Status />
          )
        }
      </DataState>
    </>
  );
}
