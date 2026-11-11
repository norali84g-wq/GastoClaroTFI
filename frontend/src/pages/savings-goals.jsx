import { DeleteRecord, useDeleteRecord } from '../components/delete-record.jsx';
import { Status } from '../components/chanchito.jsx';
import { GoalCard } from '../components/goal-card.jsx';
import { GoalImagePicker, useGoalImage } from '../components/goal-image-picker.jsx';
import { goalBody } from '../domain/goal-images.js';
import { useState } from 'react';
import { DataState, Field, FormError, formatMoney } from '../components/common.jsx';
import { EditorActions, RecordActions } from '../components/planning.jsx';
import { useAction, useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

function GoalForm({ item, onSaved, onCancel }) {
  const { busy, error, run } = useAction();
  const image = useGoalImage(item?.image_url);

  function submit(event) {
    event.preventDefault();
    if (image.busy || image.error) return;
    const values = new FormData(event.currentTarget);
    const body = {
      name: values.get('name').trim(),
      target_amount: Number(values.get('target_amount')),
      saved_amount: Number(values.get('saved_amount')),
      deadline: values.get('deadline') || null,
    };
    run(async () => {
      const payload = goalBody(body, image.file, image.removeImage);
      const saved = item
        ? await api.updateSavingsGoal(item.id, payload)
        : await api.createSavingsGoal(payload);
      const imageApplied = image.file ? Boolean(saved.image_url) : !saved.image_url;
      onSaved((image.file || image.removeImage) && !imageApplied);
    });
  }

  return (
    <section className="panel movement-editor">
      <h2>{item ? text.editGoal : text.newGoal}</h2>
      <form onSubmit={submit}>
        <Field label={text.name} name="name" defaultValue={item?.name} error={error} required />
        <Field
          label={text.targetAmount}
          name="target_amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={item?.target_amount}
          error={error}
          required
        />
        <Field
          label={text.savedAmount}
          name="saved_amount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={item?.saved_amount ?? 0}
          error={error}
          required
        />
        <Field
          label={text.deadline}
          name="deadline"
          type="date"
          defaultValue={item?.deadline ?? ''}
          error={error}
        />
        <GoalImagePicker image={image} apiError={error} disabled={busy} />
        <FormError
          retrySubmit
          error={error}
          fieldNames={[
            'name',
            'target_amount',
            'saved_amount',
            'deadline',
            'image',
            'remove_image',
          ]}
        />
        <EditorActions
          busy={busy}
          blocked={image.busy || Boolean(image.error)}
          onCancel={onCancel}
        />
      </form>
    </section>
  );
}

function SavingsHistory() {
  const result = useData(api.savings);
  return (
    <section className="panel">
      <h2>{text.savingsHistory}</h2>
      <DataState result={result}>
        {({ months }) =>
          months.length ? (
            <>
              <p>
                {text.accumulatedSavings} ·{' '}
                <strong>{formatMoney(months.at(-1).accumulated)}</strong>
              </p>
              <details>
                <summary>{text.historyDetails}</summary>
                <dl className="planning-facts">
                  {[...months].reverse().map((month) => (
                    <div key={month.month}>
                      <dt>{month.month}</dt>
                      <dd>{formatMoney(month.savings)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </>
          ) : (
            <Status message={text.noSavingsHistory} />
          )
        }
      </DataState>
    </section>
  );
}

export function SavingsGoals({ initialEditor = false }) {
  const [editor, setEditor] = useState(() => (initialEditor ? {} : null));
  const [imageNotice, setImageNotice] = useState(false);
  const goals = useData(api.savingsGoals);
  const deletion = useDeleteRecord(api.removeSavingsGoal, goals.reload);
  const disabled = Boolean(editor) || deletion.busy;

  return (
    <>
      <h1>{text.savingsGoals}</h1>
      <button type="button" disabled={disabled} onClick={() => setEditor({})}>
        {text.newGoal}
      </button>
      {editor && (
        <GoalForm
          key={editor.item?.id ?? 'new'}
          item={editor.item}
          onCancel={() => setEditor(null)}
          onSaved={(notice) => {
            setImageNotice(notice);
            setEditor(null);
            goals.reload();
          }}
        />
      )}
      {imageNotice && <Status pose="pensativo" message={text.goalImageUnavailable} />}
      <DeleteRecord action={deletion} />
      <DataState result={goals}>
        {(items) =>
          items.length ? (
            <ul className="records planning-grid">
              {items.map((item) => (
                <li className="panel planning-card" key={item.id}>
                  <GoalCard goal={item}>
                    <RecordActions
                      disabled={disabled}
                      onEdit={() => setEditor({ item })}
                      onRemove={() => deletion.ask(item, item.name)}
                    />
                  </GoalCard>
                </li>
              ))}
            </ul>
          ) : (
            <Status message={text.noGoals} />
          )
        }
      </DataState>
      <SavingsHistory />
    </>
  );
}
