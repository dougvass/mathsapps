import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses and looks after your personal information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const email = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

  return (
    <LegalPage title="Privacy Policy" updated="29 October 2026">
      <p>
        {SITE_NAME} is a small Australian business selling 3D printed toys at {SITE_URL}. This
        policy explains what personal information we collect, why, and how we look after it. If you
        have any questions, email {email}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Orders.</strong> Payments are handled by Stripe, our payment provider. Stripe
          collects your name, email address, shipping address and payment details. We receive your
          name, email, shipping address and what you ordered (including any colour, size or custom
          text). We never see or store your full card number.
        </li>
        <li>
          <strong>Reviews.</strong> If you write a review, the first name, star rating and review
          text you enter are published on our website for everyone to see. We briefly use your
          internet (IP) address to stop spam; it isn&apos;t published or stored with your review.
        </li>
        <li>
          <strong>Your cart.</strong> Items in your cart and any discount code you apply are saved
          in your own browser so they&apos;re still there when you come back. They aren&apos;t sent
          to us until you check out.
        </li>
        <li>
          <strong>Website hosting.</strong> Our website is hosted by Vercel, which may record
          technical details such as your IP address and browser type to keep the site secure and
          running well.
        </li>
        <li>
          <strong>Emails you send us.</strong> If you contact us, we keep your message and email
          address so we can reply.
        </li>
      </ul>
      <p>We don&apos;t use advertising trackers or sell your information to anyone.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To make, pack and deliver your order, and contact you about it.</li>
        <li>To answer your questions and handle returns or refunds.</li>
        <li>To show reviews on our website.</li>
        <li>To keep records we&apos;re required to keep for tax and accounting.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We only share what&apos;s needed to run the shop:</p>
      <ul>
        <li>Stripe – to process payments and refunds.</li>
        <li>Australia Post or another courier – your name and address, to deliver your order.</li>
        <li>Vercel – to host our website and store our shop data.</li>
      </ul>
      <p>
        Stripe and Vercel may store information on servers outside Australia, such as in the
        United States. They have their own privacy and security protections.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep order records for as long as the law requires for tax and accounting. Reviews stay
        on the website until they&apos;re removed. Email {email} if you&apos;d like your review
        taken down.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask to see the personal information we hold about you, ask us to correct it, or ask
        us to delete it where we&apos;re allowed to. Just email {email}. If you&apos;re unhappy with
        how we&apos;ve handled your information, please tell us and we&apos;ll do our best to fix
        it.
      </p>

      <h2>Kids</h2>
      <p>
        Many of our customers are kids, but orders should be placed by a parent or guardian. Please
        only use a first name when writing a review.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we&apos;ll update it on this page and change the date at the top.
      </p>
    </LegalPage>
  );
}
