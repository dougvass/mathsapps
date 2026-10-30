// When the shop changed on the server while the admin page was open (another
// tab or device, or a sale changing stock), keep the admin's own edits and take
// everything else from the latest data, instead of refusing to save.
type Editable = Record<string, unknown> & { products: { id: string }[] };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function mergeEdits<T extends Editable>(base: T, mine: T, theirs: T): T {
  const merged: Record<string, unknown> = { ...theirs };
  for (const key of Object.keys(mine)) {
    if (key === "products") continue;
    if (!same(mine[key], base[key])) merged[key] = mine[key];
  }

  const baseById = new Map(base.products.map((p) => [p.id, p]));
  const mineById = new Map(mine.products.map((p) => [p.id, p]));
  const theirsById = new Map(theirs.products.map((p) => [p.id, p]));

  // Start from my order if I reordered, otherwise theirs.
  const reordered = !same(mine.products.map((p) => p.id), base.products.map((p) => p.id).filter((id) => mineById.has(id)));
  const order = reordered ? mine.products.map((p) => p.id) : theirs.products.map((p) => p.id);
  // Products I added, and ones they added that I don't know about.
  for (const p of mine.products) if (!order.includes(p.id) && !baseById.has(p.id)) order.push(p.id);
  for (const p of theirs.products) if (!order.includes(p.id) && !baseById.has(p.id)) order.push(p.id);

  const products = order
    .map((id) => {
      const mineP = mineById.get(id);
      const baseP = baseById.get(id);
      const theirsP = theirsById.get(id);
      if (baseP && !mineP) return null; // I deleted it
      if (mineP && (!baseP || !same(mineP, baseP))) return mineP; // I added or changed it
      return theirsP ?? mineP ?? null;
    })
    .filter((p): p is T["products"][number] => p !== null);

  // Same fields, in the same order, as the admin page's own data.
  return Object.fromEntries(Object.keys(mine).map((key) => [key, key === "products" ? products : merged[key]])) as T;
}
