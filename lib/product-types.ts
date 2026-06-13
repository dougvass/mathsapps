export type ProductCategory = "fidgets" | "shapes" | "custom";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  emoji: string;
  image: string;
  active: boolean;
};

export const CATEGORY_ORDER: ProductCategory[] = ["fidgets", "shapes", "custom"];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  fidgets: "Fidgets",
  shapes: "Standard Shapes",
  custom: "Design Your Own",
};
