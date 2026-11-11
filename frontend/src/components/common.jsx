import { useId } from 'react';
import { displayError } from '../hooks/data.js';
import { CategoryOptions } from './category-options.jsx';
import { Chanchito, Status } from './chanchito.jsx';
import { text } from '../texts.js';

export function Field({ label, error, children, multiline = false, ...props }) {
  const id = useId();
  const { name } = props;
  const messages = error?.issues?.filter((item) => item.field === name).map((item) => item.message);
  const issue = messages?.length > 0;
  const Control = children ? 'select' : multiline ? 'textarea' : 'input';
  const attributes = {
    ...props,
    id,
    'aria-invalid': issue ? true : undefined,
    'aria-describedby': issue ? `${id}-error` : undefined,
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Control {...attributes}>{children}</Control>
      {issue && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {messages.join(' · ')}
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
  const options = categories.filter(({ id, active }) => active !== false || id === defaultValue);
  const unavailableParents = new Set(
    grouped && !allowParents
      ? categories.map(({ parent_id }) => parent_id).filter((id) => id != null)
      : [],
  );
  const invalidParent = unavailableParents.has(defaultValue);
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
        <CategoryOptions
          categories={options}
          allowParents={allowParents}
          unavailableParents={unavailableParents}
          markInactive
        />
      ) : (
        options.map(({ id, name, active }) => (
          <option key={id} value={id}>
            {active === false ? text.inactiveCategory(name) : name}
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
