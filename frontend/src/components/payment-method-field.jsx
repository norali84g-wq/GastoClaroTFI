import { DataState, Field } from './common.jsx';
import { useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

export function PaymentMethodField({ defaultValue = '', error }) {
  const result = useData(api.paymentMethods);
  return (
    <DataState result={result}>
      {(items) => (
        <Field
          label={text.paymentMethod}
          name="payment_method_id"
          defaultValue={items.some(({ id }) => id === defaultValue) ? defaultValue : ''}
          error={error}
        >
          <option value="">{text.noPaymentMethod}</option>
          {items.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Field>
      )}
    </DataState>
  );
}
