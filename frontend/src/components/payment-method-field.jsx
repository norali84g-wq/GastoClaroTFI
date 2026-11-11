import { useState } from 'react';
import { DataState, Field } from './common.jsx';
import { TarjetaIcono } from './tarjeta-icono.jsx';
import { useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

function PaymentMethodSelect({ items, defaultValue, error, keepCurrent }) {
  const current = String(defaultValue);
  const known = items.some(({ id }) => String(id) === current);
  const [selected, setSelected] = useState(known || keepCurrent ? current : '');
  const method = items.find(({ id }) => String(id) === selected);

  return (
    <div className="gc-payment-picker">
      <TarjetaIcono medio={method} />
      <Field
        label={text.paymentMethod}
        name="payment_method_id"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        error={error}
      >
        <option value="">{text.noPaymentMethod}</option>
        {keepCurrent && current && !known && (
          <option value={current}>{text.assignedPaymentMethod}</option>
        )}
        {items.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </Field>
    </div>
  );
}

export function PaymentMethodField({ defaultValue = '', error, keepCurrent = false }) {
  const result = useData(api.paymentMethods);
  return (
    <DataState result={result}>
      {(items) => (
        <PaymentMethodSelect
          items={items}
          defaultValue={defaultValue}
          error={error}
          keepCurrent={keepCurrent}
        />
      )}
    </DataState>
  );
}
