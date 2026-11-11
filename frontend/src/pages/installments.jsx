import { DeleteRecord, useDeleteRecord } from '../components/delete-record.jsx';
import { Link } from '@tanstack/react-router';
import { EditorActions, MonthPicker, Progress, RecordActions } from '../components/planning.jsx';
import { TarjetaIcono } from '../components/tarjeta-icono.jsx';
import { Status } from '../components/chanchito.jsx';
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

function PurchaseForm({ categories, period, item, onSaved, onCancel }) {
  const { busy, error, run } = useAction();

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      description: values.description.trim(),
      total_amount: Number(values.total_amount),
      installments_count: Number(values.installments_count),
      interest_rate: Number(values.interest_rate),
      category_id: Number(values.category_id),
      first_period: values.first_period,
      ...(values.payment_method_id
        ? { payment_method_id: Number(values.payment_method_id) }
        : item && values.payment_method_id === ''
          ? { payment_method_id: null }
          : {}),
    };
    run(async () =>
      onSaved(await (item ? api.updatePurchase(item.id, body) : api.createPurchase(body))),
    );
  }

  return (
    <section className="panel">
      <h2>{item ? text.editPurchase : text.newPurchase}</h2>
      {!categories.length && <Status message={text.noCategories} />}
      <form onSubmit={submit}>
        <Field
          label={text.description}
          name="description"
          defaultValue={item?.description}
          error={error}
          required
        />
        <Field
          label={text.purchaseTotal}
          name="total_amount"
          defaultValue={item?.total_amount}
          type="number"
          min="0.01"
          step="0.01"
          error={error}
          required
        />
        <Field
          label={text.count}
          name="installments_count"
          defaultValue={item?.installments_count}
          type="number"
          min="1"
          max="48"
          step="1"
          error={error}
          required
        />
        <Field
          label={text.firstPeriod}
          name="first_period"
          type="month"
          defaultValue={item?.first_period ?? period}
          error={error}
          required
        />
        <Field
          label={text.interest}
          name="interest_rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={item?.interest_rate ?? 0}
          error={error}
        />
        <CategoryField categories={categories} defaultValue={item?.category_id} error={error} />
        <PaymentMethodField
          defaultValue={item?.payment_method_id ?? ''}
          keepCurrent
          error={error}
        />
        <FormError
          retrySubmit
          error={error}
          fieldNames={[
            'description',
            'total_amount',
            'installments_count',
            'first_period',
            'interest_rate',
            'category_id',
            'payment_method_id',
          ]}
        />
        <EditorActions busy={busy} blocked={!categories.length} onCancel={onCancel} />
      </form>
    </section>
  );
}

function PurchaseCard({ purchase, method, expanded, toggle, onEdit, onRemove, disabled }) {
  const load = useCallback((signal) => api.installments(purchase.id, signal), [purchase.id]);
  const result = useData(load);
  const action = useAction();
  const id = `installments-${purchase.id}`;
  return (
    <li className="panel gc-payment-card">
      <div className="gc-payment-heading">
        <TarjetaIcono medio={method} />
        <div>
          <h2>{purchase.description}</h2>
          {method && <p>{method.name}</p>}
          <p>
            {text.totalWithInterest} · {formatMoney(purchase.total_with_interest)}
          </p>
          <p>
            {text.count} · {purchase.installments_count} · {text.installmentAmount} ·{' '}
            {formatMoney(purchase.installment_amount)}
          </p>
        </div>
      </div>
      <RecordActions disabled={disabled || action.busy} onEdit={onEdit} onRemove={onRemove} />
      <FormError error={action.error} />
      <DataState result={result}>
        {(items) => {
          const paid = items.filter((item) => item.paid).length;
          const progress = text.paidInstallments(paid, purchase.installments_count);
          return (
            <>
              <p>{progress}</p>
              <Progress
                label={progress}
                percentage={Math.round((paid / purchase.installments_count) * 100)}
              />
              <button
                className="secondary"
                type="button"
                aria-expanded={expanded}
                aria-controls={id}
                onClick={toggle}
              >
                {expanded ? text.closeDetails : text.viewInstallments}
              </button>
              <div id={id} hidden={!expanded}>
                {items.length ? (
                  <ul className="records movement-list">
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
                            type="button"
                            disabled={action.busy || disabled}
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
                  <Status />
                )}
              </div>
            </>
          );
        }}
      </DataState>
    </li>
  );
}

export function Installments() {
  const [period, setPeriod] = useState(currentPeriod);
  const [purchase, setPurchase] = useState(null);
  const [editor, setEditor] = useState(null);
  const categories = useData(api.categories);
  const purchases = useData(api.purchases);
  const methods = useData(api.paymentMethods);
  const loadMonth = useCallback((signal) => api.installmentMonthlyTotal(period, signal), [period]);
  const monthly = useData(loadMonth);

  function reload() {
    monthly.reload();
    purchases.reload();
  }

  const deletion = useDeleteRecord(api.removePurchase, (item) => {
    if (purchase === item.id) setPurchase(null);
    reload();
  });
  const disabled = Boolean(editor) || deletion.busy;

  return (
    <>
      <h1>{text.installments}</h1>
      <div className="toolbar">
        <MonthPicker period={period} onChange={setPeriod} disabled={disabled} />
        <button type="button" disabled={disabled} onClick={() => setEditor({})}>
          {text.newPurchase}
        </button>
        <Link className="button secondary" to="/medios-de-pago">
          {text.paymentMethods}
        </Link>
      </div>
      <section className="panel planning-card">
        <h2>{text.installmentMonthTotal}</h2>
        <DataState result={monthly}>
          {(data) => (
            <>
              <strong className="movement-amount">{formatMoney(data.installments_total)}</strong>
              <p>
                {text.monthlyFee} · {formatMoney(data.card_monthly_fee)}
              </p>
              <p>
                {text.installmentWithFees} · <strong>{formatMoney(data.total)}</strong>
              </p>
              <p className="muted">{text.installmentsCalendarHint}</p>
            </>
          )}
        </DataState>
      </section>
      {editor && (
        <DataState result={categories}>
          {(items) => (
            <PurchaseForm
              key={editor.item?.id ?? 'new'}
              item={editor.item}
              categories={items}
              period={period}
              onCancel={() => setEditor(null)}
              onSaved={(saved) => {
                setEditor(null);
                setPurchase(saved.id);
                setPeriod(saved.first_period);
                reload();
              }}
            />
          )}
        </DataState>
      )}
      {editor && (categories.error || categories.loading) && (
        <button type="button" className="secondary" onClick={() => setEditor(null)}>
          {text.cancel}
        </button>
      )}
      <DeleteRecord action={deletion} />
      <DataState result={purchases}>
        {(items) =>
          items.length ? (
            <ul className="records planning-grid">
              {items.map((item) => (
                <PurchaseCard
                  key={item.id}
                  purchase={item}
                  method={methods.data?.find(({ id }) => id === item.payment_method_id)}
                  disabled={disabled}
                  onEdit={() => setEditor({ item })}
                  onRemove={() => deletion.ask(item, item.description)}
                  expanded={purchase === item.id}
                  toggle={() => setPurchase(purchase === item.id ? null : item.id)}
                />
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
