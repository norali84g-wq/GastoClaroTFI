import { DeleteRecord, useDeleteRecord } from '../components/delete-record.jsx';
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
import { EditorActions, MonthPicker, RecordActions } from '../components/planning.jsx';
import { shiftPeriod } from '../domain/periods.js';
import { useAction, useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

const quantityFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 6 });

function ShoppingForm({ categories, item, period, onSaved, onCancel }) {
  const { busy, error, run } = useAction();

  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const quantity = values.get('quantity');
    const body = {
      name: values.get('name').trim(),
      period,
      quantity: quantity === '' ? null : Number(quantity),
      estimated_unit_price: Number(values.get('estimated_unit_price')),
      category_id: Number(values.get('category_id')),
    };
    run(async () => {
      if (item) await api.updateShoppingItem(item.id, body);
      else await api.createShoppingItem(body);
      onSaved();
    });
  }

  return (
    <section className="panel movement-editor">
      <h2>{item ? text.editShoppingItem : text.addExpenseItem}</h2>
      <form onSubmit={submit}>
        <Field label={text.name} name="name" defaultValue={item?.name} error={error} required />
        <CategoryField categories={categories} defaultValue={item?.category?.id} error={error} />
        <Field
          label={text.itemQuantity}
          name="quantity"
          type="number"
          min="0"
          step="any"
          defaultValue={item ? (item.quantity ?? '') : 1}
          error={error}
        />
        <Field
          label={text.estimatedUnitPrice}
          name="estimated_unit_price"
          type="number"
          min="0"
          step="0.01"
          defaultValue={item?.estimated_unit_price}
          error={error}
          required
        />
        <FormError
          retrySubmit
          error={error}
          fieldNames={['name', 'quantity', 'estimated_unit_price', 'category_id']}
        />
        <EditorActions busy={busy} blocked={!categories.length} onCancel={onCancel} />
      </form>
    </section>
  );
}

export function ShoppingList() {
  const [period, setPeriod] = useState(currentPeriod);
  const [editor, setEditor] = useState(null);
  const [copyMessage, setCopyMessage] = useState('');
  const load = useCallback((signal) => api.shoppingItems(period, signal), [period]);
  const list = useData(load);
  const categories = useData(api.categories);
  const action = useAction();
  const deletion = useDeleteRecord(api.removeShoppingItem, list.reload);
  const disabled = Boolean(editor) || action.busy || deletion.busy;

  function toggle(item) {
    action.run(async () => {
      await api.updateShoppingItem(item.id, { purchased: !item.purchased });
      list.reload();
    });
  }

  function copy() {
    const nextPeriod = shiftPeriod(period, 1);
    setCopyMessage('');
    action.run(async () => {
      const copied = await api.copyShoppingItems(period, nextPeriod);
      if (copied.length) setPeriod(nextPeriod);
      setCopyMessage(copied.length ? text.copyDone(copied.length, nextPeriod) : text.nothingCopied);
    });
  }

  return (
    <>
      <h1>{text.shoppingList}</h1>
      <div className="toolbar">
        <MonthPicker
          period={period}
          disabled={disabled}
          onChange={(value) => {
            setPeriod(value);
            setCopyMessage('');
          }}
        />
        <button type="button" disabled={disabled} onClick={() => setEditor({})}>
          {text.addExpenseItem}
        </button>
        <button
          className="secondary"
          type="button"
          disabled={disabled || !list.data?.length}
          onClick={copy}
        >
          {text.copyShoppingList}
        </button>
      </div>
      <p className="muted">{text.copyPendingHint}</p>
      {copyMessage && <p role="status">{copyMessage}</p>}
      {editor && (
        <DataState result={categories}>
          {(items) => (
            <ShoppingForm
              key={editor.item?.id ?? 'new'}
              categories={items}
              item={editor.item}
              period={period}
              onCancel={() => setEditor(null)}
              onSaved={() => {
                setEditor(null);
                list.reload();
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
      <FormError error={action.error} />
      <DeleteRecord action={deletion} />
      <DataState result={list}>
        {(items) =>
          items.length ? (
            <>
              <div className="panel movement-total">
                {text.estimatedTotal}
                <strong>
                  {formatMoney(items.reduce((sum, item) => sum + Number(item.subtotal), 0))}
                </strong>
              </div>
              <ul className="records movement-records">
                {items.map((item) => (
                  <li className="panel record" key={item.id}>
                    <label className="planning-check">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        disabled={disabled}
                        onChange={() => toggle(item)}
                        aria-label={
                          item.purchased
                            ? text.unmarkPurchased(item.name)
                            : text.markPurchased(item.name)
                        }
                      />
                      <span>
                        <strong>{item.name}</strong>
                        <br />
                        <small>
                          {item.category?.name ?? text.noCategory}
                          {item.quantity !== null && (
                            <>
                              {' '}
                              · {quantityFormat.format(item.quantity)} ×{' '}
                              {formatMoney(item.estimated_unit_price)}
                            </>
                          )}
                        </small>
                      </span>
                    </label>
                    <strong>{formatMoney(item.subtotal)}</strong>
                    <RecordActions
                      disabled={disabled}
                      onEdit={() => setEditor({ item })}
                      onRemove={() => deletion.ask(item, item.name)}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Status message={text.noShoppingItems} />
          )
        }
      </DataState>
    </>
  );
}
