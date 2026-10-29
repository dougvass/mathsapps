import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { MAX_CUSTOM_TEXT_LENGTH } from "@/lib/product-types";
import {
  CHANGE_OF_MIND_RETURN_DAYS,
  CONTACT_EMAIL,
  FAULTY_ITEM_REPORT_DAYS,
  FREE_SHIPPING_THRESHOLD_AUD_CENTS,
  SITE_NAME,
  STANDARD_SHIPPING_AUD_CENTS,
} from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${SITE_NAME}`,
  description: `The terms for buying from ${SITE_NAME}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const email = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  const freeOver = `$${FREE_SHIPPING_THRESHOLD_AUD_CENTS / 100}`;

  return (
    <LegalPage title="Terms & Conditions" updated="29 October 2026">
      <p>
        These terms apply when you use the {SITE_NAME} website or buy from us. {SITE_NAME} is a
        small business in Australia. Questions? Email {email}.
      </p>

      <h2>Our products</h2>
      <ul>
        <li>
          Everything is 3D printed in PLA and finished by hand, often made to order. Small
          differences in colour, layer lines and finish are normal and part of the charm.
        </li>
        <li>Sizes are approximate and describe the largest measurement of the item.</li>
        <li>Photos show the style of each item; yours may vary slightly in colour.</li>
      </ul>

      <h2>Safety</h2>
      <ul>
        <li>
          Our toys are for ages 3 and up. <strong>Not suitable for children under 3</strong> –
          contains small parts that could be a choking hazard.
        </li>
        <li>They&apos;re not designed to be chewed. Young children should be supervised.</li>
        <li>PLA can soften in heat – keep toys out of hot cars, direct sun and dishwashers.</li>
      </ul>

      <h2>Custom orders</h2>
      <p>
        {`For personalised items, we print the name or text exactly as you type it (up to ${MAX_CUSTOM_TEXT_LENGTH} characters), so please check the spelling.`} We may refuse text that
        is offensive or that we don&apos;t have the right to print, and refund you instead.
      </p>

      <h2>Prices and payment</h2>
      <ul>
        <li>Prices are in Australian dollars. Payment is taken securely by Stripe at checkout.</li>
        <li>
          If a price is shown incorrectly, or we can&apos;t fill your order (for example, an item
          sold out), we&apos;ll contact you and give you a full refund for anything we can&apos;t
          supply.
        </li>
      </ul>

      <h2>Discount codes</h2>
      <p>
        One code per order. Each code has its own conditions (such as an end date, a minimum order
        or first orders only). Codes have no cash value and we may end a promotion at any time.
      </p>

      <h2>Shipping</h2>
      <ul>
        <li>We currently ship within Australia only.</li>
        <li>
          Most orders are printed and posted within 3–5 business days, then take 3–7 business days
          with Australia Post. Custom designs can take a little longer. Delivery times are estimates
          and occasionally there are delays outside our control.
        </li>
        <li>
          Standard shipping is ${(STANDARD_SHIPPING_AUD_CENTS / 100).toFixed(2)}, or free on orders
          of {freeOver} or more. Free local pickup is also available at checkout.
        </li>
      </ul>

      <h2>Returns and refunds</h2>
      <ul>
        <li>
          <strong>Changed your mind?</strong>{" "}
          {`Return unused items within ${CHANGE_OF_MIND_RETURN_DAYS} days for a refund. You pay the return postage.`}
        </li>
        <li>
          <strong>Faulty item?</strong>{" "}
          {`Let us know within ${FAULTY_ITEM_REPORT_DAYS} days and we'll repair, replace or refund it.`}
        </li>
        <li>
          <strong>Custom items</strong>{" "}
          (Design Your Own) are made just for you, so they can&apos;t be returned for a change of
          mind.
        </li>
        <li>
          Nothing in these terms limits your rights under the Australian Consumer Law, including
          your rights if an item is faulty or not as described.
        </li>
      </ul>
      <p>To start a return, email {email} with your name and order details.</p>

      <h2>Reviews</h2>
      <p>
        Reviews should be honest and about your own experience. Links, offensive language and
        other people&apos;s personal details aren&apos;t allowed, and we may remove any review.
      </p>

      <h2>Our content</h2>
      <p>
        Our product designs, photos and website content belong to {SITE_NAME}. Please don&apos;t
        copy or resell them without permission.
      </p>

      <h2>Our responsibility</h2>
      <p>
        To the extent the law allows, our responsibility for any problem with an item is limited to
        repairing, replacing or refunding it. This doesn&apos;t affect any rights you have under the
        Australian Consumer Law that can&apos;t be excluded.
      </p>

      <p>
        See also our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
