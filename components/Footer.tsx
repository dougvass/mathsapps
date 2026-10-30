import Link from "next/link";
import type { SocialLinks } from "@/lib/product-types";
import {
  CHANGE_OF_MIND_RETURN_DAYS,
  CONTACT_EMAIL,
  FAULTY_ITEM_REPORT_DAYS,
  FREE_SHIPPING_THRESHOLD_AUD_CENTS,
} from "@/lib/site";
import SocialIcons from "./SocialIcons";

// Phones get tap-to-open sections so the footer isn't a wall of text.
function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <details className="group border-t border-white/10 pt-3 sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between font-display font-semibold text-white">
          {title}
          <span className="text-htz-lime transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        {children}
      </details>
      <div className="hidden sm:block">
        <p className="font-display font-semibold text-white">{title}</p>
        {children}
      </div>
    </>
  );
}

export default function Footer({ socialLinks }: { socialLinks: SocialLinks }) {
  return (
    <footer id="footer" className="bg-htz-navy text-white/80">
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 sm:pb-12 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl font-bold text-white">
              Hugos<span className="text-htz-lime">Toyz</span>
            </p>
            <p className="mt-2 text-sm">
              Playful 3D-printed fidgets and toys, made in small batches.
            </p>
            <div className="mt-4">
              <SocialIcons links={socialLinks} />
            </div>
          </div>

          <div>
            <p className="font-display font-semibold text-white">Contact</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="break-all hover:text-htz-lime">
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <FooterSection title="Shipping">
            <p className="mt-2 text-sm">
              Aussie-wide shipping. Most orders print and ship within 3–5
              business days. Custom designs may take a little longer — worth
              the wait!
            </p>
            <p className="mt-2 text-sm font-semibold text-htz-lime">
              {`Free standard shipping on orders over $${FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100}.`}
            </p>
          </FooterSection>

          <div id="returns" className="scroll-mt-36">
            <FooterSection title="Returns">
              <ul className="mt-2 space-y-2 text-sm">
              <li>
                <span className="font-semibold text-white">Changed your mind?</span>{" "}
                {`Return unused items within ${CHANGE_OF_MIND_RETURN_DAYS} days and we'll refund your money. Return postage is paid by you.`}
              </li>
              <li>
                <span className="font-semibold text-white">Faulty item?</span>{" "}
                {`Let us know within ${FAULTY_ITEM_REPORT_DAYS} days and we'll repair, replace or refund it.`}
              </li>
              <li>
                <span className="font-semibold text-white">Custom items</span>{" "}
                (Design Your Own) are made just for you, so they can&apos;t be returned for a
                change of mind.
              </li>
            </ul>
            <p className="mt-2 text-xs text-white/50">
              This doesn&apos;t affect your rights under Australian Consumer Law.
            </p>
            </FooterSection>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-6 text-center">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-htz-lime px-6 py-2 font-display text-sm font-bold text-htz-navy shadow transition-transform hover:scale-105 active:scale-95"
          >
            🔐 Admin Login
          </a>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs" aria-label="Policies">
            <Link href="/track" className="hover:text-htz-lime">
              Track order
            </Link>
            <Link href="/help" className="hover:text-htz-lime">
              Help
            </Link>
            <Link href="/privacy" className="hover:text-htz-lime">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-htz-lime">
              Terms &amp; Conditions
            </Link>
            <Link href="#returns" className="hover:text-htz-lime">
              Returns
            </Link>
          </nav>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} HugosToyz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
