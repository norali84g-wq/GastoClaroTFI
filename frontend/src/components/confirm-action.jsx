import { useEffect, useId, useRef } from 'react';
import { FormError } from './common.jsx';
import { text } from '../texts.js';

export function ConfirmAction({ title, description, label, busy, error, onCancel, onConfirm }) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="panel gc-delete-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{description}</p>
      <FormError error={error} />
      <div className="actions">
        <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
          {text.cancel}
        </button>
        <button type="button" disabled={busy} onClick={onConfirm}>
          {busy ? text.saving : label}
        </button>
      </div>
    </dialog>
  );
}
