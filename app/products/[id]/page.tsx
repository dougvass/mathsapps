import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadShopData } from "@/lib/shop-data";
import { productPhotos } from "@/lib/product-types";
import {
  absoluteUrl,
  CHANGE_OF_MIND_RETURN_DAYS,
  NON_RETURNABLE_CATEGORY,
  productPath,
  productUrl,
  SITE_NAME,
} from "@/lib/site";
import { jsonLdScript, productJsonLd } from "@/lib/structured-data";
import ShopShell from "@/components/ShopShell";
import ProductGallery from "@/components/ProductGallery";
import BuyBox from "@/components/BuyBox";
import PrintYourFile from "@/components/PrintYourFile";
import MysteryBagBuilder from "@/components/MysteryBagBuilder";
import { FILE_PRINT_ID, MYSTERY_BAG_ID } from "@/lib/product-types";
import ProductBadgeTag from "@/components/ProductBadgeTag";
import ProductRow from "@/components/ProductRow";
import ProductReviews from "@/components/ProductReviews";
import RecentlyViewed from "@/components/RecentlyViewed";
import ShareButton from "@/components/ShareButton";
import WishlistButton from "@/components/WishlistButton";
import Stars from "@/components/Stars";

// Always read the latest store data so admin edits show up without a redeploy.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function loadPage(id: string) {
  const data = await loadShopData();
  return { ...data, product: data.products.find((p) => p.id === id) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product } = await loadPage(id);
  if (!product) return { title: `Not found | ${SITE_NAME}` };

  const title = `${product.name} | 3D Printed | ${SITE_NAME}`;
  const description =
    product.description ||
    `${product.name} – 3D printed and finished by hand in Australia by ${SITE_NAME}.`;
  const photo = productPhotos(product)[0];

  return {
    title,
    description,
    alternates: { canonical: productPath(product.id) },
    openGraph: {
      type: "website",
      url: productPath(product.id),
      siteName: SITE_NAME,
      title,
      description,
      locale: "en_AU",
      ...(photo ? { images: [{ url: absoluteUrl(photo), alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(photo ? { images: [absoluteUrl(photo)] } : {}),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const { products, config, reviews, shop, product } = await loadPage(id);
  if (!product) notFound();

  const category = config.categories.find((c) => c.value === product.category);
  const productReviews = reviews.filter((r) => r.productId === product.id);
  const rating = shop.ratings[product.id];
  const related = products.filter((p) => p.category === product.category && p.id !== product.id);
  const returnsNote =
    product.category === NON_RETURNABLE_CATEGORY
      ? "Made just for you, so no change-of-mind returns."
      : `Change-of-mind returns within ${CHANGE_OF_MIND_RETURN_DAYS} days.`;

  return (
    <ShopShell shop={shop} socialLinks={config.socialLinks}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(productJsonLd(product, config.categories, productReviews))}
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-3 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/shop" className="hover:text-htz-orange hover:underline">
                  Shop
                </Link>
              </li>
              {category && (
                <li>
                  {"› "}
                  <Link
                    href={`/shop?category=${encodeURIComponent(category.value)}`}
                    className="hover:text-htz-orange hover:underline"
                  >
                    {category.label}
                  </Link>
                </li>
              )}
              <li aria-current="page" className="text-ink">
                {`› ${product.name}`}
              </li>
            </ol>
          </nav>
          <ShareButton title={product.name} url={productUrl(product.id)} />
        </div>

        <div className="grid grid-cols-1 gap-6 rounded-2xl bg-surface p-4 shadow-sm sm:p-6 md:grid-cols-2 md:gap-10">
          <div className="relative md:sticky md:top-36 md:self-start">
            <WishlistButton
              productId={product.id}
              productName={product.name}
              className="absolute right-3 top-3 z-10 h-11 w-11 text-2xl"
            />
            <ProductGallery product={product} />
          </div>

          <div className="flex flex-col gap-3">
            <ProductBadgeTag badge={product.badge} className="self-start" />
            <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
              {product.name}
            </h1>
            {rating ? (
              <a href="#product-reviews" className="flex items-center gap-2 text-sm text-accent hover:underline">
                <Stars rating={rating.average} size="text-base" />
                {`${rating.average.toFixed(1)} · ${rating.count} ${rating.count === 1 ? "review" : "reviews"}`}
              </a>
            ) : (
              <a href="#product-reviews" className="text-sm text-accent hover:underline">
                Be the first to review this
              </a>
            )}
            {product.description && <p className="text-lg text-ink/80">{product.description}</p>}
            <div className="rounded-2xl border border-ink/10 p-4">
              {product.id === FILE_PRINT_ID ? (
                <PrintYourFile product={product} />
              ) : product.id === MYSTERY_BAG_ID ? (
                <MysteryBagBuilder product={product} />
              ) : (
                <BuyBox product={product} />
              )}
            </div>
            <ul className="flex flex-col gap-1.5 text-sm text-ink/70">
              <li>🖨️ 3D printed in PLA and finished by hand in Australia.</li>
              <li>📦 Printed and posted within 3–5 business days.</li>
              <li>↩️ {returnsNote}</li>
              <li>⚠️ Not suitable for children under 3 – small parts.</li>
            </ul>
          </div>
        </div>

        <ProductRow
          title={`More ${category?.label ?? "from the shop"}`}
          products={related}
          seeAllHref={category ? `/shop?category=${encodeURIComponent(category.value)}` : "/shop"}
        />
        <ProductReviews productId={product.id} productName={product.name} reviews={productReviews} />
        <RecentlyViewed currentId={product.id} hidden />
      </div>
    </ShopShell>
  );
}
