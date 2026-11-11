import { useEffect, useId, useRef, useState } from 'react';
import { GoalImage } from './goal-card.jsx';
import { galleryImage, goalImageUrl, shrinkGoalImage } from '../domain/goal-images.js';
import { text } from '../texts.js';

export function useGoalImage(existing) {
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(
    () => () => {
      revision.current += 1;
    },
    [],
  );

  async function choose(load, key) {
    const request = ++revision.current;
    setBusy(true);
    setError('');
    try {
      const image = await shrinkGoalImage(await load());
      if (revision.current !== request) return;
      setFile(image);
      setSelected(key);
      setRemoveImage(false);
    } catch (failure) {
      if (revision.current === request) setError(failure.message);
    } finally {
      if (revision.current === request) setBusy(false);
    }
  }

  function clear() {
    revision.current += 1;
    setFile(null);
    setPreview(null);
    setSelected(null);
    setError('');
    setBusy(false);
    setRemoveImage(Boolean(existing));
  }

  return {
    file,
    removeImage,
    selected,
    preview: file ? preview : !removeImage && goalImageUrl(existing),
    busy,
    error,
    choose,
    clear,
  };
}

export function GoalImagePicker({ image, apiError, disabled }) {
  const id = useId();
  const message =
    image.error ||
    apiError?.issues?.find(({ field }) => field === 'image' || field === 'remove_image')?.message;
  return (
    <fieldset className="gc-image-picker" disabled={disabled}>
      <legend>{text.chooseGoalImage}</legend>
      <GoalImage src={image.preview} />
      <div className="gc-image-gallery">
        {Object.entries(text.goalGallery).map(([key, label]) => (
          <button
            type="button"
            className="secondary"
            aria-pressed={image.selected === key}
            key={key}
            onClick={() =>
              image.choose(async () => {
                const response = await fetch(galleryImage(key));
                if (!response.ok) throw new Error(text.invalidGoalImage);
                const blob = await response.blob();
                return new File([blob], `${key}.webp`, { type: blob.type });
              }, key)
            }
          >
            <GoalImage src={galleryImage(key)} size={52} /> <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor={id}>{text.uploadGoalImage}</label>
        <input
          id={id}
          type="file"
          accept="image/*"
          aria-describedby={message ? `${id}-error` : undefined}
          onChange={(event) => {
            const file = event.target.files[0];
            if (file) image.choose(() => file, null);
            event.target.value = '';
          }}
        />
      </div>
      <button type="button" className="secondary" onClick={image.clear}>
        {text.removeGoalImage}
      </button>
      {image.busy && <p role="status">{text.goalImagePreparing}</p>}
      {message && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {message}
        </p>
      )}
    </fieldset>
  );
}
