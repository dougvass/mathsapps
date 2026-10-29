export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 100;
export const NAME_MAX = 40;

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN) {
    return `Your password needs at least ${PASSWORD_MIN} characters.`;
  }
  if (password.length > PASSWORD_MAX) return "That password is too long.";
  return null;
}

export function validEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
