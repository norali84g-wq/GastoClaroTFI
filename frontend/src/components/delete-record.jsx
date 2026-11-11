import { useEffect, useId, useRef, useState } from 'react';
import { displayError } from '../hooks/data.js';
import { text } from '../texts.js';
import { Status } from './chanchito.jsx';

export function useDeleteRecord(remove, onDeleted) {
  const [target, setTarget] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  function ask(record, label) {
    setError(null);
    setNotice('');
    setTarget({ record, label });
  }

  function cancel() {
    if (!inFlight.current) setTarget(null);
  }

  async function confirm() {
    if (!target || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await remove(target.record.id);
      setNotice(text.recordDeleted);
      setTarget(null);
      onDeleted(target.record);
    } catch (failure) {
      setError(failure);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return { ask, cancel, confirm, target, error, busy, notice };
}

export function DeleteRecord({ action, category = false }) {
  const ref = useRef(null);
  const title = useId();
  const description = useId();
  const open = Boolean(action.target);

  useEffect(() => {
    if (open) {
      const dialog = ref.current;
      dialog.showModal();
      return () => dialog.close();
    }
  }, [open]);

  const invalid = action.error?.status === 422;
  const network = action.error instanceof TypeError;
  return (
    <>
      {action.notice && (
        <p role="status" className="gc-delete-success">
          {action.notice}
        </p>
      )}
      {open && (
        <dialog
          ref={ref}
          className="panel gc-delete-dialog"
          aria-labelledby={title}
          aria-describedby={description}
          onCancel={(event) => {
            event.preventDefault();
            action.cancel();
          }}
        >
          <h2 id={title}>
            {category
              ? text.deleteCategory(action.target.label)
              : text.deleteRecord(action.target.label)}
          </h2>
          <p id={description}>{text.deletePermanent}</p>
          {action.error && (
            <Status
              pose={invalid ? 'preocupado' : 'error'}
              message={category && invalid ? text.categoryInUse : displayError(action.error)}
              onRetry={network ? action.confirm : undefined}
            />
          )}
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={action.busy}
              onClick={action.cancel}
            >
              {text.cancel}
            </button>
            <button
              type="button"
              className="movement-danger"
              disabled={action.busy || Boolean(action.error)}
              onClick={action.confirm}
            >
              {action.busy ? text.deleting : text.remove}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
