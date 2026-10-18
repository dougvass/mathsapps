// The address search engines and link previews use. Change this when a custom
// domain (e.g. https://hugostoyz.com) is connected in Vercel.
export const SITE_URL = "https://hugostoyz.vercel.app";

export const SITE_NAME = "HugosToyz";

export const SITE_TITLE = "HugosToyz | 3D Printed Fidget Toys & Custom Gifts in Australia";

export const SITE_DESCRIPTION =
  "Shop colourful 3D printed fidget toys, articulated dragons and animals, and personalised name keychains. Printed and finished by hand in Australia, with Aussie-wide shipping.";

export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : new URL(path, SITE_URL).toString();
}
