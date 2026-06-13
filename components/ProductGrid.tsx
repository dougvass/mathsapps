import type { CategoryDef, Product, SizeOption } from "@/lib/product-types";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  categories,
  colors,
  sizeOptions,
}: {
  products: Product[];
  categories: CategoryDef[];
  colors: string[];
  sizeOptions: SizeOption[];
}) {
  return (
    <section id="shop" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold text-htz-navy sm:text-4xl">
          Shop the Fidget Lineup
        </h2>
        <p className="mt-3 text-htz-navy/70">
          3D-printed, hand-finished, and made for busy hands. Pick a favourite
          or grab a few.
        </p>
      </div>

      <div className="flex flex-col gap-14">
        {categories.map((category) => {
          const items = products.filter((product) => product.category === category.value);
          if (items.length === 0) return null;

          return (
            <div key={category.value}>
              <h3 className="font-display mb-6 text-2xl font-semibold text-htz-navy">
                {category.label}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    colors={colors}
                    sizeOptions={sizeOptions}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
