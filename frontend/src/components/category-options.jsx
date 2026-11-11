import { categoryChoices, categoryTree } from '../domain/categories.js';
import { text } from '../texts.js';

export function CategoryOptions({
  categories,
  allowParents = false,
  unavailableParents,
  markInactive = false,
}) {
  const tree = categoryTree(
    markInactive
      ? categories.map((category) =>
          category.active === false
            ? { ...category, name: text.inactiveCategory(category.name) }
            : category,
        )
      : categories,
  );
  return tree.map(({ id, name, children }) =>
    children.length ? (
      <optgroup key={id} label={name}>
        {allowParents && <option value={id}>{text.wholeCategory(name)}</option>}
        {categoryChoices(children, allowParents)
          .filter((item) => !unavailableParents?.has(item.id))
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.branch ? text.wholeCategory(item.label) : item.label}
            </option>
          ))}
      </optgroup>
    ) : !unavailableParents?.has(id) ? (
      <option key={id} value={id}>
        {name}
      </option>
    ) : null,
  );
}
