// Choices for the mystery bag; the shopper's picks travel with the cart line.
export const MYSTERY_LIKES = ["Fidgets", "Clickers", "Animals", "Dragons", "Puzzles"] as const;
export const MYSTERY_COLOURS = ["Bright & rainbow", "Dark & cool", "Pastel", "Any colours"] as const;

export function mysteryWishes(likes: string[], colours: string): string {
  const picked = likes.length > 0 ? likes.join(", ") : "Surprise me";
  return `Likes: ${picked} · Colours: ${colours}`;
}

// Only accept wishes built from the choices above.
export function validMysteryWishes(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = value.match(/^Likes: (.+) · Colours: (.+)$/);
  if (!match) return false;
  const likes = match[1] === "Surprise me" ? [] : match[1].split(", ");
  return (
    likes.every((like) => (MYSTERY_LIKES as readonly string[]).includes(like)) &&
    (MYSTERY_COLOURS as readonly string[]).includes(match[2])
  );
}
