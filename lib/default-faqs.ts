import type { Faq } from "./product-types";
import { MAX_CUSTOM_TEXT_LENGTH } from "./product-types";
import { CHANGE_OF_MIND_RETURN_DAYS, FAULTY_ITEM_REPORT_DAYS } from "./site";

// Starting FAQ content; the admin panel can edit or replace all of it.
export const DEFAULT_FAQS: Faq[] = [
  {
    question: "What are your toys made from?",
    answer:
      "PLA – a plant-based plastic that's tough, lightweight and great for bright colours. Every piece is printed on our own 3D printer and finished by hand.",
  },
  {
    question: "What ages are they suitable for?",
    answer:
      "Ages 3 and up. Not suitable for children under 3 – contains small parts that could be a choking hazard.",
  },
  {
    question: "How do I look after my toy?",
    answer:
      "PLA can soften and warp in heat, so keep it out of hot cars, direct sun and the dishwasher. Wipe clean with a damp cloth.",
  },
  {
    question: "How long will my order take?",
    answer:
      "Most orders are printed and posted within 3–5 business days, then take 3–7 business days with Australia Post. Custom designs can take a little longer.",
  },
  {
    question: "Can I choose the colour?",
    answer:
      "Design Your Own items let you pick a colour when you order. Other items are printed in our chosen colours – get in touch if you'd like a particular colour and we'll see what we can do.",
  },
  {
    question: "How do custom name orders work?",
    answer: `Type the name or text you'd like (up to ${MAX_CUSTOM_TEXT_LENGTH} characters) in the box before adding the item to your cart. Double-check the spelling – we print it exactly as typed.`,
  },
  {
    question: "Do you ship outside Australia?",
    answer:
      "Not yet – we ship Australia-wide only. Free local pickup is also available at checkout.",
  },
  {
    question: "What's your returns policy?",
    answer: `Changed your mind? Return unused items within ${CHANGE_OF_MIND_RETURN_DAYS} days for a refund (return postage is paid by you). Faulty item? Let us know within ${FAULTY_ITEM_REPORT_DAYS} days and we'll repair, replace or refund it. Custom items can't be returned for a change of mind. This doesn't affect your rights under Australian Consumer Law.`,
  },
  {
    question: "How do I use a discount code?",
    answer:
      "Enter it on the payment page under \"Add promotion code\". On a phone, tap the order summary at the top of the payment page to find it.",
  },
];
