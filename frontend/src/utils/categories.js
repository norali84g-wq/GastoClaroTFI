// Ordena las categorías como un árbol: cada categoría principal por nombre y, justo debajo, sus
// subcategorías por nombre. Una subcategoría cuya principal no está en la lista va al final, como
// si fuera principal, para que no desaparezca.
export function orderAsTree(categories) {
  const ids = new Set(categories.map(({ id }) => id));
  const byName = (a, b) => a.name.localeCompare(b.name);
  const roots = categories
    .filter(({ parentId }) => parentId === null || !ids.has(parentId))
    .toSorted(byName);

  return roots.flatMap((root) => [
    root,
    ...categories.filter(({ parentId }) => parentId === root.id).toSorted(byName),
  ]);
}
