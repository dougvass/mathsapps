import Stripe from "stripe";
import { updateAccount, type Account } from "./accounts";
import { EMPTY_ADDRESS, type AccountView, type Address } from "./rewards-rules";

export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export function addressFromCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer | null): Address {
  if (!customer || customer.deleted || !customer.shipping) return EMPTY_ADDRESS;
  const { name, address } = customer.shipping;
  return {
    name: name ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postcode: address?.postal_code ?? "",
  };
}

// The parts of an account the shopper sees, plus live posted status and address.
export async function accountView(account: Account): Promise<AccountView> {
  const stripe = stripeClient();
  const recent = account.orders.slice(0, 10);
  const [posted, customer] = await Promise.all([
    Promise.all(
      recent.map(async (order) => {
        if (!stripe || !order.paymentIntentId) return false;
        try {
          const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
          return Boolean(intent.metadata?.posted_at);
        } catch {
          return false;
        }
      })
    ),
    stripe && account.stripeCustomerId
      ? stripe.customers.retrieve(account.stripeCustomerId).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    name: account.name,
    email: account.email,
    picture: account.picture,
    points: account.points,
    history: account.history.slice(0, 20),
    birthday: account.birthday,
    reviewBonusUsed: account.reviewBonusUsed,
    referralCode: account.referralCode,
    wishlist: account.wishlist,
    orders: recent.map((order, i) => ({ ...order, posted: posted[i] })),
    rewardCodes: account.rewardCodes.slice(0, 10),
    address: addressFromCustomer(customer),
    hasPassword: Boolean(account.passwordHash),
  };
}

// Each account gets one Stripe customer, which remembers the shipping address.
export async function ensureStripeCustomer(stripe: Stripe, account: Account): Promise<string> {
  if (account.stripeCustomerId) return account.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: account.email,
    name: account.name,
    metadata: { accountId: account.id },
  });
  const saved = await updateAccount(account.id, (a) =>
    a.stripeCustomerId ? null : { ...a, stripeCustomerId: customer.id }
  );
  // If two requests raced, keep whichever customer was saved first.
  return saved?.stripeCustomerId || customer.id;
}
