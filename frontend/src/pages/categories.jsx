import { DeleteRecord, useDeleteRecord } from '../components/delete-record.jsx';
import { Link } from '@tanstack/react-router';
import { useContext, useState } from 'react';
import { AdministrationTabs } from '../components/administration-tabs.jsx';
import { CategoriaIcono } from '../components/categoria-icono.jsx';
import { Status } from '../components/chanchito.jsx';
import { DataState, Field, FormError } from '../components/common.jsx';
import { EditorActions } from '../components/planning.jsx';
import { SelectorIcono } from '../components/selector-icono.jsx';
import { categoryDescendants, categoryTree } from '../domain/categories.js';
import { iconoPorNombre } from '../domain/icons.js';
import { useAction } from '../hooks/data.js';
import { useIconPreferences } from '../hooks/icon-preferences.jsx';
import { AccountContext, api } from '../hooks/session.js';
import { text } from '../texts.js';

function CategoryForm({ item, parentId, items, onSaved, onCancel }) {
  const { categoryIcons } = useIconPreferences();
  const [parent, setParent] = useState(() => String(item?.parent_id ?? parentId ?? ''));
  const [name, setName] = useState(item?.name ?? '');
  const [icon, setIcon] = useState(() => (item ? categoryIcons.selected(item) : ''));
  const { busy, error, run } = useAction();
  const automatic = iconoPorNombre(name);
  const forbidden = item ? categoryDescendants(item.id, items) : new Set();
  const title = item ? text.editCategory : parentId ? text.newSubcategory : text.newCategory;

  function submit(event) {
    event.preventDefault();
    run(async () => {
      const body = {
        name: name.trim(),
        parent_id: parent === '' ? null : Number(parent),
        icon: icon || automatic,
      };
      const saved = item ? await api.updateCategory(item.id, body) : await api.createCategory(body);
      const local = categoryIcons.remember(saved, icon);
      onSaved(local && Boolean(icon));
    });
  }

  return (
    <section className="panel movement-editor">
      <h2>{title}</h2>
      <form onSubmit={submit}>
        <Field
          label={text.name}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={error}
          required
        />
        <Field
          label={text.parentCategory}
          name="parent_id"
          required={Boolean(parentId)}
          value={parent}
          onChange={(event) => setParent(event.target.value)}
          error={error}
        >
          {!parentId && <option value="">{text.noParentCategory}</option>}
          {items
            .filter(
              (candidate) =>
                !forbidden.has(candidate.id) &&
                (candidate.parent_id == null || candidate.id === item?.parent_id),
            )
            .map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
        </Field>
        <SelectorIcono
          valor={icon}
          onChange={setIcon}
          automatico={automatic}
          error={error}
          disabled={busy}
        />
        <FormError retrySubmit error={error} fieldNames={['name', 'parent_id', 'icon']} />
        <EditorActions busy={busy} onCancel={onCancel} />
      </form>
    </section>
  );
}

function CategoryBranch({
  node,
  root = false,
  admin,
  disabled,
  setEditor,
  collapsed,
  setCollapsed,
  askDelete,
  onToggleActive,
}) {
  const { id, name, children, active } = node;
  const expanded = !collapsed.has(id);
  const label = (
    <>
      <CategoriaIcono nombre={name} id={id} size={root ? 40 : 28} />
      <strong>{name}</strong>
      {active === false && (
        <span className="administration-badge is-inactive">{text.categoryInactive}</span>
      )}
    </>
  );
  function toggle() {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <li>
      <div className="gc-category-row">
        {children.length ? (
          <button
            type="button"
            className="gc-category-toggle secondary"
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls={`category-children-${id}`}
          >
            <span className="gc-category-arrow" aria-hidden="true">
              {expanded ? '▾' : '▸'}
            </span>
            {label}
            <small>{text.categoryChildren(children.length)}</small>
          </button>
        ) : (
          <span className="gc-category-heading">{label}</span>
        )}
        {admin && (
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={disabled}
              onClick={() => setEditor({ item: node })}
            >
              {text.edit}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={disabled}
              onClick={() => onToggleActive(node)}
            >
              {active === false ? text.activate : text.deactivate}
            </button>
            {askDelete && (
              <button
                type="button"
                className="movement-danger"
                disabled={disabled}
                onClick={() => askDelete(node, name)}
              >
                {text.remove}
              </button>
            )}
            {root && (
              <button
                type="button"
                className="secondary"
                disabled={disabled}
                onClick={() => setEditor({ parentId: id })}
              >
                {text.newSubcategory}
              </button>
            )}
          </div>
        )}
      </div>
      {children.length > 0 && (
        <ul
          className="records gc-category-children"
          id={`category-children-${id}`}
          hidden={!expanded}
        >
          {children.map((child) => (
            <CategoryBranch
              key={child.id}
              node={child}
              admin={admin}
              disabled={disabled}
              askDelete={askDelete}
              onToggleActive={onToggleActive}
              setEditor={setEditor}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Categories({ allowDeletion = false }) {
  const { admin } = useContext(AccountContext);
  const { categories, categoryIcons } = useIconPreferences();
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState(false);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const deletion = useDeleteRecord(api.removeCategory, (item) => {
    categoryIcons.remember(item, '');
    setNotice(false);
    categories.reload();
  });
  const activation = useAction();
  const disabled = Boolean(editor) || deletion.busy || activation.busy;

  function toggleActive(item) {
    activation.run(async () => {
      await api.updateCategory(item.id, { active: item.active === false });
      categories.reload();
    });
  }

  return (
    <>
      <Link to="/consumos">{text.backToExpenses}</Link>
      <h1>{text.categories}</h1>
      {admin && <AdministrationTabs current="categorias" />}
      {admin && (
        <button type="button" disabled={disabled} onClick={() => setEditor({})}>
          {text.newCategory}
        </button>
      )}
      {admin && editor && (
        <CategoryForm
          item={editor.item}
          parentId={editor.parentId}
          items={categories.data ?? []}
          onCancel={() => setEditor(null)}
          onSaved={(local) => {
            setNotice(local);
            setEditor(null);
            categories.reload();
          }}
        />
      )}
      {notice && <p role="status">{text.iconSavedLocally}</p>}
      {admin && <FormError error={activation.error} />}
      {admin && allowDeletion && <DeleteRecord action={deletion} category />}
      <DataState result={categories}>
        {(items) =>
          items.length ? (
            <ul className="panel records gc-category-tree">
              {categoryTree(items).map((node) => (
                <CategoryBranch
                  key={node.id}
                  node={node}
                  root
                  admin={admin}
                  disabled={disabled}
                  askDelete={allowDeletion ? deletion.ask : undefined}
                  onToggleActive={toggleActive}
                  setEditor={setEditor}
                  collapsed={collapsed}
                  setCollapsed={setCollapsed}
                />
              ))}
            </ul>
          ) : (
            <Status message={text.noCategories} />
          )
        }
      </DataState>
    </>
  );
}
