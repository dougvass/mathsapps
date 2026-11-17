// A basic bad-language check for reviews. It blocks swearing and insults, not
// criticism: an honest "this broke" or "this toy sucks" review still goes through. It can't catch everything (people are
// inventive), so the admin can add their own words and delete reviews too.
const BUILT_IN = [
  "fuck", "fucking", "fucker", "fuk", "fck", "shit", "shitty", "bullshit", "bitch", "bastard",
  "asshole", "arsehole", "arse", "dick", "dickhead", "cock", "pussy", "cunt", "twat", "wanker", "wank",
  "prick", "slut", "whore", "piss", "pissed", "bollocks", "bugger", "goddamn", "douche", "douchebag",
  "retard", "retarded", "spastic", "fag", "faggot", "dyke", "nigger", "nigga", "chink", "paki", "tranny",
  "nazi", "rape", "rapist", "porn", "sex", "sexy", "boobs", "tits", "penis", "vagina", "dildo", "nude", "nudes",
  "kys", "kill yourself", "stfu", "wtf", "idiot", "moron", "dumbass", "hate you",
];

export const BLOCKED_WORDS_MAX = 200;
export const BLOCKED_WORD_MAX_LENGTH = 40;

const LOOKALIKES: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };

// Lower case, with look-alike symbols swapped for letters (sh1t, @ss) and
// everything else that isn't a letter turned into a space.
function simplify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[0134578@$!]/g, (c) => LOOKALIKES[c])
    .replace(/[^a-z]+/g, " ")
    .trim();
}

// Tidies the admin's own list: trimmed, lower case, no repeats.
export function cleanBlockedWords(words: unknown): string[] {
  if (!Array.isArray(words)) return [];
  const cleaned = words
    .filter((w): w is string => typeof w === "string")
    .map((w) => w.trim().toLowerCase().slice(0, BLOCKED_WORD_MAX_LENGTH))
    .filter(Boolean);
  return [...new Set(cleaned)].slice(0, BLOCKED_WORDS_MAX);
}

// True if the text has a blocked word or phrase. Matches whole words only, so
// "Scunthorpe" or "class" are fine, but also catches letters stretched out or
// spaced apart ("shiiit", "s h i t").
export function hasRudeWords(text: string, extraWords: string[] = []): boolean {
  const simple = simplify(text);
  // "shiiiit" -> "shit", so repeats can't dodge the list.
  const squeezed = simple.replace(/([a-z])\1+/g, "$1");
  // "s h i t" -> "shit": join runs of single letters.
  const joined = simple.replace(/\b([a-z]) (?=[a-z]\b)/g, "$1");
  const versions = [simple, squeezed, joined].map((v) => ` ${v} `);

  return [...BUILT_IN, ...extraWords].some((word) => {
    const target = simplify(word);
    if (!target) return false;
    const squeezedTarget = target.replace(/([a-z])\1+/g, "$1");
    return versions[0].includes(` ${target} `) || versions[1].includes(` ${squeezedTarget} `) || versions[2].includes(` ${target} `);
  });
}
