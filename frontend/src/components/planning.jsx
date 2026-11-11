import { currentPeriod, Field } from './common.jsx';
import { text } from '../texts.js';

export function MonthPicker({ period, onChange, disabled }) {
  return (
    <Field
      label={text.period}
      type="month"
      value={period}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value || currentPeriod())}
    />
  );
}

export function Progress({ label, percentage }) {
  return (
    <div className="planning-progress">
      <progress aria-label={label} max="100" value={Math.max(0, Math.min(percentage, 100))} />
      <strong>{percentage}%</strong>
    </div>
  );
}

export function EditorActions({ busy, blocked, onCancel }) {
  return (
    <div className="actions">
      <button type="submit" disabled={busy || blocked}>
        {busy ? text.saving : text.save}
      </button>
      <button className="secondary" type="button" disabled={busy} onClick={onCancel}>
        {text.cancel}
      </button>
    </div>
  );
}

export function RecordActions({ disabled, onEdit, onRemove }) {
  return (
    <div className="actions">
      <button className="secondary" type="button" disabled={disabled} onClick={onEdit}>
        {text.edit}
      </button>
      <button className="movement-danger" type="button" disabled={disabled} onClick={onRemove}>
        {text.remove}
      </button>
    </div>
  );
}
