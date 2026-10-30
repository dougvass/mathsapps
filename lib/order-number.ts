// A short order number customers can read out, made from the Stripe checkout id.
export function orderNumber(sessionId: string): string {
  return `HTZ-${sessionId.slice(-8).toUpperCase()}`;
}

export function matchesOrderNumber(sessionId: string, entered: string): boolean {
  const code = entered.trim().toUpperCase().replace(/^HTZ-?/, "");
  return code.length === 8 && sessionId.slice(-8).toUpperCase() === code;
}
