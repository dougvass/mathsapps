// The address search engines and link previews use. Change this when a custom
// domain (e.g. https://hugostoyz.com) is connected in Vercel.
// Set NEXT_PUBLIC_SITE_URL in Vercel when the shop moves to its own domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hugostoyz.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "HugosToyz";

export const CONTACT_EMAIL = "hugostoyz1526@gmail.com";

// Other ways people write the name, so search engines link them to this site.
export const SITE_ALTERNATE_NAMES = ["Hugos Toyz", "Hugo's Toyz", "Hugos Toys", "HTZ"];
export const SITE_TITLE = "HugosToyz | 3D Printed Fidget Toys & Custom Gifts in Australia";

export const SITE_DESCRIPTION =
  "Shop colourful 3D printed fidget toys, articulated dragons and animals, and personalised name keychains. Printed and finished by hand in Australia, with Aussie-wide shipping.";

// Flat-rate domestic shipping, charged at checkout and listed for search engines.
// Adjust to match real postage costs.
export const STANDARD_SHIPPING_AUD_CENTS = 995;
// Standard shipping is free when the items (after any cart discount code) reach this.
export const FREE_SHIPPING_THRESHOLD_AUD_CENTS = 5000;

// Returns policy, shown in the footer and listed for search engines.
export const CHANGE_OF_MIND_RETURN_DAYS = 20;
export const FAULTY_ITEM_REPORT_DAYS = 15;
// Personalised items in this category can't be returned for change of mind.
export const NON_RETURNABLE_CATEGORY = "custom";

export function productPath(productId: string): string {
  return `/products/${productId}`;
}

export function productUrl(productId: string): string {
  return `${SITE_URL}${productPath(productId)}`;
}

export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : new URL(path, SITE_URL).toString();
}
