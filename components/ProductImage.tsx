import type { Product } from "@/lib/product-types";

const CATEGORY_GRADIENTS: Record<Product["category"], string> = {
  fidgets: "from-htz-orange to-htz-pink",
  shapes: "from-htz-teal to-htz-navy",
  custom: "from-htz-pink to-htz-orange",
};

export default function ProductImage({ product }: { product: Product }) {
  if (product.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${CATEGORY_GRADIENTS[product.category]}`}
    >
      <span className="text-6xl drop-shadow-sm" aria-hidden="true">
        {product.emoji}
      </span>
    </div>
  );
}
