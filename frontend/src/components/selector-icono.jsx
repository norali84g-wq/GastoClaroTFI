import { useId, useState } from 'react';
import { catalogoIconos, normalizarIconos } from '../domain/icons.js';
import { Icono } from './icono.jsx';
import { text } from '../texts.js';

export function SelectorIcono({ valor, onChange, automatico, error, disabled }) {
  const [query, setQuery] = useState('');
  const id = useId();
  const search = normalizarIconos(query);
  const matches = catalogoIconos.filter(({ etiqueta }) =>
    normalizarIconos(etiqueta).includes(search),
  );
  const groups = new Map();
  for (const item of matches) {
    if (!groups.has(item.grupo)) groups.set(item.grupo, []);
    groups.get(item.grupo).push(item);
  }
  const selected = catalogoIconos.find((item) => item.clave === valor);
  const issue = error?.issues?.find(({ field }) => field === 'icon');

  return (
    <fieldset
      className="gc-icon-picker"
      disabled={disabled}
      aria-describedby={issue ? `${id}-error` : undefined}
    >
      <legend>{text.chooseIcon}</legend>
      <div className="gc-category-heading">
        <Icono clave={valor || automatico} />
        <span>{selected?.etiqueta ?? text.automaticIcon}</span>
        {valor && (
          <button type="button" className="secondary" onClick={() => onChange('')}>
            {text.removeIcon}
          </button>
        )}
      </div>
      <details>
        <summary>{text.browseIcons}</summary>
        <div className="field">
          <label htmlFor={id}>{text.searchIcons}</label>
          <input
            id={id}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="gc-icon-picker-list">
          {[...groups].map(([group, items]) => (
            <section key={group} aria-label={group}>
              <h3>{group}</h3>
              <div className="gc-icon-picker-grid">
                {items.map(({ clave, etiqueta }) => (
                  <button
                    className="secondary"
                    type="button"
                    aria-pressed={valor === clave}
                    key={clave}
                    onClick={() => onChange(clave)}
                  >
                    <Icono clave={clave} size={44} />
                    <span>{etiqueta}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!matches.length && <p role="status">{text.noIcons}</p>}
        </div>
      </details>
      {issue && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {issue.message}
        </p>
      )}
    </fieldset>
  );
}
