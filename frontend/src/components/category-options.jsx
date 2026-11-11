import { categoryChoices, categoryTree } from '../domain/categories.js';
import { text } from '../texts.js';

export function CategoryOptions({ categories, allowParents = false }) {
  return categoryTree(categories).map(({ id, name, children }) =>
    children.length ? (
      <optgroup key={id} label={name}>
        {allowParents && <option value={id}>{text.wholeCategory(name)}</option>}
        {categoryChoices(children, allowParents).map((item) => (
          <option key={item.id} value={item.id}>
            {item.branch ? text.wholeCategory(item.label) : item.label}
          </option>
        ))}
      </optgroup>
    ) : (
      <option key={id} value={id}>
        {name}
      </option>
    ),
  );
}
