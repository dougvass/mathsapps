import { BADGE_LABELS, type CategoryDef, type Product } from "./product-types";

// Matches every word of the query against name, description, category and badge.
export function searchProducts(products: Product[], categories: CategoryDef[], query: string): Product[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return products;
  return products.filter((product) => {
    const category = categories.find((c) => c.value === product.category)?.label ?? "";
    const text = [product.name, product.description, category, product.badge ? BADGE_LABELS[product.badge] : ""]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
