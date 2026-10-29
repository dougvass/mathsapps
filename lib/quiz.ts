import type { Product } from "./product-types";

// The fidget quiz: each answer adds points to toys whose name or description
// mentions its words, so it keeps working as new toys are added.
export type QuizQuestion = {
  id: string;
  question: string;
  answers: { label: string; emoji: string; words: string[]; maxPrice?: number }[];
};

export const QUIZ: QuizQuestion[] = [
  {
    id: "sound",
    question: "Clicky or quiet?",
    answers: [
      { label: "Clicky!", emoji: "🔊", words: ["click", "loud", "pop", "gear"] },
      { label: "Quiet please", emoji: "🤫", words: ["quiet", "silent", "smooth", "flexi", "snake", "spin"] },
      { label: "Don't mind", emoji: "🤷", words: [] },
    ],
  },
  {
    id: "action",
    question: "What do your hands like to do?",
    answers: [
      { label: "Spin", emoji: "🌀", words: ["spin", "gear", "twist"] },
      { label: "Bend & pose", emoji: "🐉", words: ["dragon", "fox", "octopus", "snake", "articulated", "flexi", "poseable", "wiggly"] },
      { label: "Solve", emoji: "🧩", words: ["puzzle", "cube", "assemble", "challenge"] },
      { label: "Click & slide", emoji: "🔘", words: ["click", "slide", "slider", "pop"] },
    ],
  },
  {
    id: "budget",
    question: "How much do you want to spend?",
    answers: [
      { label: "Under $10", emoji: "💰", words: [], maxPrice: 10 },
      { label: "Under $20", emoji: "💵", words: [], maxPrice: 20 },
      { label: "Treat myself", emoji: "🎉", words: [] },
    ],
  },
];

export function recommend(products: Product[], answers: number[]): Product[] {
  const chosen = answers.map((answer, i) => QUIZ[i].answers[answer]);
  const maxPrice = Math.min(...chosen.map((a) => a.maxPrice ?? Infinity));
  const words = chosen.flatMap((a) => a.words);
  return products
    .filter((p) => p.stock !== "out-of-stock" && p.price <= maxPrice)
    .map((p) => {
      const text = `${p.name} ${p.description}`.toLowerCase();
      const score = words.filter((word) => text.includes(word)).length + (p.badge === "bestseller" ? 0.5 : 0);
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ p }) => p);
}
