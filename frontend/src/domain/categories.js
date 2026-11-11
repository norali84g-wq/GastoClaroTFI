export function categoryTree(categories) {
  const nodes = new Map(categories.map((category) => [category.id, { ...category, children: [] }]));
  const roots = [];
  for (const node of nodes.values()) {
    const parent = nodes.get(node.parent_id);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export function categoryChoices(children, allowParents = false, prefix = '') {
  return children.flatMap(({ id, name, children: nested }) => {
    const label = prefix ? `${prefix} › ${name}` : name;
    if (!nested.length) return [{ id, label }];
    const descendants = categoryChoices(nested, allowParents, label);
    return allowParents ? [{ id, label, branch: true }, ...descendants] : descendants;
  });
}

export function categoryDescendants(id, categories) {
  const found = new Set([id]);
  const pending = [id];
  while (pending.length) {
    const parent = pending.pop();
    for (const category of categories) {
      if (category.parent_id === parent && !found.has(category.id)) {
        found.add(category.id);
        pending.push(category.id);
      }
    }
  }
  return found;
}

export function groupStatisticsCategories(rows, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const groups = new Map();
  for (const row of rows) {
    let root = byId.get(row.category.id) ?? row.category;
    const seen = new Set([root.id]);
    while (byId.has(root.parent_id) && !seen.has(root.parent_id)) {
      root = byId.get(root.parent_id);
      seen.add(root.id);
    }
    const previous = groups.get(root.id) ?? {
      category_id: root.id,
      category: root.name,
      cents: 0,
      percentage: 0,
    };
    previous.cents += Math.round(Number(row.total) * 100);
    previous.percentage += Number(row.percentage);
    groups.set(root.id, previous);
  }

  return [...groups.values()]
    .map(({ cents, percentage, ...category }) => ({
      ...category,
      total: cents / 100,
      reportedPercentage: Math.round(percentage * 10) / 10,
    }))
    .sort((a, b) => b.total - a.total);
}
