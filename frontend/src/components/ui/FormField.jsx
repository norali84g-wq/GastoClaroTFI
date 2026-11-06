import { useId } from 'react';
import ErrorMessage from './ErrorMessage';

// Campo con su label asociado. `errors` acepta lo que devuelve toFormErrors para ese campo.
// Con as="select" las opciones van como children. Un checkbox muestra el label después de la
// casilla, como es habitual.
export default function FormField({
  id,
  label,
  hint,
  errors,
  required,
  as: Control = 'input',
  children,
  ...controlProps
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const hasErrors = [].concat(errors ?? []).length > 0;
  const describedBy = [hint && hintId, hasErrors && errorId].filter(Boolean).join(' ');
  const isCheckbox = controlProps.type === 'checkbox';
  const labelElement = <label htmlFor={inputId}>{label}</label>;

  return (
    <div className={isCheckbox ? 'form-field form-field--checkbox' : 'form-field'}>
      {!isCheckbox && labelElement}
      <Control
        id={inputId}
        required={required}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy || undefined}
        {...controlProps}
      >
        {children}
      </Control>
      {isCheckbox && labelElement}
      {hint && (
        <p id={hintId} className="form-field__hint">
          {hint}
        </p>
      )}
      <ErrorMessage id={errorId} messages={errors} />
    </div>
  );
}
