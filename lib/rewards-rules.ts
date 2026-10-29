// How customers earn and spend reward points. Shared by the server and the pages.
export const POINTS_PER_DOLLAR = 1;
export const SIGNUP_POINTS = 50;
export const REVIEW_POINTS = 20;
export const BIRTHDAY_POINTS = 50;
export const REFERRAL_POINTS = 100;
export const REDEEM_POINTS = 100;
export const REDEEM_VALUE_CENTS = 500;

export type PointsEntry = { at: string; points: number; reason: string };

export type AccountOrder = {
  sessionId: string;
  paymentIntentId: string;
  date: string;
  totalCents: number;
  items: string[];
  pointsEarned: number;
};

export type RewardCode = { code: string; valueCents: number; createdAt: string };

export type Address = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
};

export const EMPTY_ADDRESS: Address = { name: "", line1: "", line2: "", city: "", state: "", postcode: "" };

// What the shopper's own browser is told about their account.
export type AccountView = {
  name: string;
  email: string;
  picture: string;
  points: number;
  history: PointsEntry[];
  birthday: string;
  reviewBonusUsed: boolean;
  referralCode: string;
  wishlist: string[];
  orders: (AccountOrder & { posted: boolean })[];
  rewardCodes: RewardCode[];
  address: Address;
  hasPassword: boolean;
};
