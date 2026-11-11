import { useId } from 'react';
import { displayError } from '../hooks/data.js';
import { CategoryOptions } from './category-options.jsx';
import { Chanchito, Status } from './chanchito.jsx';
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
        <span id={`${id}-error`} className="field-error" role="alert">
          {issue.message}
        </span>
      )}
    </div>
  );
}

export function FormError({ error, fieldNames = [], retrySubmit = false }) {
  if (!error) return null;
  const message = error.issues?.length
    ? error.issues
        .filter(({ field }) => !fieldNames.includes(field))
        .map(({ message }) => message)
        .join(' · ')
    : displayError(error);
  return message ? (
    <div className="gc-form-error">
      <Chanchito pose="error" size={48} />
      <div>
        <p role="alert" className="error">
          {message}
        </p>
        {retrySubmit && error instanceof TypeError && (
          <button type="submit" className="secondary">
            {text.retry}
          </button>
        )}
      </div>
    </div>
  ) : null;
}

export function DataState({ result, children }) {
  if (result.loading) return <Status pose="cargando" message={text.loading} />;
  if (result.error)
    return <Status pose="error" message={displayError(result.error)} onRetry={result.reload} />;
  return children(result.data);
}

export function CategoryField({
  categories,
  error,
  defaultValue = '',
  grouped = false,
  allowParents = false,
}) {
  const invalidParent =
    grouped && !allowParents && categories.some((item) => item.parent_id === defaultValue);
  return (
    <Field
      label={text.category}
      name="category_id"
      defaultValue={invalidParent ? '' : defaultValue}
      error={error}
      required
    >
      <option value="">{text.choose}</option>
      {grouped ? (
        <CategoryOptions categories={categories} allowParents={allowParents} />
      ) : (
        categories.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))
      )}
    </Field>
  );
}

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  useGrouping: 'always',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const formatMoney = (amount) => currency.format(Number(amount));
const localDate = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Argentina/Buenos_Aires',
});
export const currentDate = () => localDate.format(new Date());
export const currentPeriod = () => currentDate().slice(0, 7);
