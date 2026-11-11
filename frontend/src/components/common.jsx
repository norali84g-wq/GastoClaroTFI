import { useId } from 'react';
import { displayError } from '../hooks/data.js';
import { text } from '../texts.js';

export function Field({ label, error, children, ...props }) {
  const id = useId();
  const { name } = props;
  const issue = error?.issues?.find((item) => item.field === name);
  const attributes = {
    ...props,
    id,
    'aria-invalid': issue ? true : undefined,
    'aria-describedby': issue ? `${id}-error` : undefined,
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children ? <select {...attributes}>{children}</select> : <input {...attributes} />}
      {issue && (
        <span id={`${id}-error`} className="field-error">
          {issue.message}
        </span>
      )}
    </div>
  );
}

export function FormError({ error }) {
  return error ? (
    <p role="alert" className="error">
      {displayError(error)}
    </p>
  ) : null;
}

export function DataState({ result, children }) {
  if (result.loading) return <p role="status">{text.loading}</p>;
  if (result.error) {
    return (
      <>
        <FormError error={result.error} />
        <button type="button" onClick={result.reload}>
          {text.retry}
        </button>
      </>
    );
  }
  return children(result.data);
}

export function CategoryField({ categories, error, defaultValue = '' }) {
  return (
    <Field
      label={text.category}
      name="category_id"
      defaultValue={defaultValue}
      error={error}
      required
    >
      <option value="">{text.choose}</option>
      {categories.map(({ id, name }) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </Field>
  );
}

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
export const formatMoney = (amount) => currency.format(Number(amount));
export const currentPeriod = () =>
  new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());
