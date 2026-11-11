import { PaymentMethodField } from '../components/payment-method-field.jsx';
import { useCallback, useState } from 'react';
import { CategoryField, DataState, Field, FormError, formatMoney } from '../components/common.jsx';
import { useAction, useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

function PurchaseForm({ categories, onSaved }) {
  const { busy, error, run } = useAction();

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      ...values,
      total_amount: Number(values.total_amount),
      installments_count: Number(values.installments_count),
      interest_rate: Number(values.interest_rate),
      category_id: Number(values.category_id),
      ...(values.payment_method_id ? { payment_method_id: Number(values.payment_method_id) } : {}),
    };
    run(async () => onSaved(await api.createPurchase(body)));
  }

  return (
    <section className="panel">
      <h2>{text.newPurchase}</h2>
      {!categories.length && <p>{text.noInstallmentCategories}</p>}
      <form onSubmit={submit}>
        <Field label={text.description} name="description" error={error} required />
        <Field
          label={text.amount}
          name="total_amount"
          type="number"
          min="0.01"
          step="0.01"
          error={error}
          required
        />
        <Field
          label={text.count}
          name="installments_count"
          type="number"
          min="1"
          max="48"
          step="1"
          error={error}
          required
        />
        <Field label={text.firstPeriod} name="first_period" type="month" error={error} required />
        <Field
          label={text.interest}
          name="interest_rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          error={error}
        />
        <CategoryField categories={categories} error={error} />
        <PaymentMethodField error={error} />
        <FormError error={error} />
        <button disabled={busy || !categories.length}>{busy ? text.saving : text.save}</button>
      </form>
    </section>
  );
}

function InstallmentDetail({ purchase }) {
  const load = useCallback((signal) => api.installments(purchase.id, signal), [purchase.id]);
  const result = useData(load);
  const action = useAction();

  return (
    <section className="panel">
      <h2>{purchase.description}</h2>
      <FormError error={action.error} />
      <DataState result={result}>
        {(items) =>
          items.length ? (
            <ul className="records">
              {items.map((item) => (
                <li className="record" key={item.id}>
                  <div>
                    <strong>
                      {text.installment} {item.number}
                    </strong>
                    <p>
                      {item.period} · {formatMoney(item.amount)}
                    </p>
                  </div>
                  <span>{item.paid ? text.paid : text.pending}</span>
                  {!item.paid && (
                    <button
                      disabled={action.busy}
                      onClick={() =>
                        action.run(async () => {
                          await api.markInstallmentAsPaid(purchase.id, item.id);
                          result.reload();
                        })
                      }
                    >
                      {text.markPaid}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>{text.empty}</p>
          )
        }
      </DataState>
    </section>
  );
}

export function Installments() {
  const [purchase, setPurchase] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const categories = useData(api.categories);
  const purchases = useData(api.purchases);

  return (
    <>
      <h1>{text.installments}</h1>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? text.cancel : text.newPurchase}
      </button>
      {showForm && (
        <DataState result={categories}>
          {(items) => (
            <PurchaseForm
              categories={items.filter((category) => category.tracks_installments === true)}
              onSaved={(saved) => {
                setShowForm(false);
                setPurchase(saved);
                purchases.reload();
              }}
            />
          )}
        </DataState>
      )}
      <DataState result={purchases}>
        {(items) =>
          items.length ? (
            <ul className="records">
              {items.map((item) => (
                <li className="panel record" key={item.id}>
                  <div>
                    <strong>{item.description}</strong>
                    <p>{formatMoney(item.total_with_interest)}</p>
                  </div>
                  <button className="secondary" onClick={() => setPurchase(item)}>
                    {text.viewInstallments}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>{text.empty}</p>
          )
        }
      </DataState>
      {purchase && <InstallmentDetail key={purchase.id} purchase={purchase} />}
    </>
  );
}
