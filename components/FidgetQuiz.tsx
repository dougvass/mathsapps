"use client";

import { useState } from "react";
import Link from "next/link";
import { useShop } from "@/lib/shop-context";
import { QUIZ, recommend } from "@/lib/quiz";
import ProductTile from "./ProductTile";

export default function FidgetQuiz() {
  const { products } = useShop();
  const [answers, setAnswers] = useState<number[]>([]);
  const step = answers.length;
  const done = step === QUIZ.length;
  const picks = done ? recommend(products, answers) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl bg-gradient-to-br from-htz-teal to-htz-navy p-6 text-white shadow-lg sm:p-10">
        <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-htz-lime">🧩 Fidget Quiz</p>
        {!done ? (
          <>
            <p className="mt-1 text-sm text-white/70">Question {step + 1} of {QUIZ.length}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
              <div className="h-full rounded-full bg-htz-lime transition-all" style={{ width: `${(step / QUIZ.length) * 100}%` }} />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">{QUIZ[step].question}</h1>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUIZ[step].answers.map((answer, i) => (
                <button
                  key={answer.label}
                  type="button"
                  onClick={() => setAnswers([...answers, i])}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-left font-display text-xl font-semibold transition-colors hover:bg-white/20"
                >
                  <span className="text-3xl" aria-hidden="true">{answer.emoji}</span>
                  {answer.label}
                </button>
              ))}
            </div>
            {step > 0 && (
              <button type="button" onClick={() => setAnswers(answers.slice(0, -1))} className="mt-4 text-sm text-white/70 hover:underline">
                ← Back
              </button>
            )}
          </>
        ) : (
          <>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Your perfect fidgets! 🎉</h1>
            <button type="button" onClick={() => setAnswers([])} className="mt-2 text-sm text-white/70 hover:underline">
              ↺ Take the quiz again
            </button>
          </>
        )}
      </div>

      {done && (
        <div className="mt-6">
          {picks.length === 0 ? (
            <p className="rounded-2xl bg-surface p-6 text-center text-ink/70 shadow-sm">
              Nothing matches right now – <Link href="/shop" className="font-semibold text-htz-orange">have a look at everything</Link>.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
              {picks.map((product) => (
                <li key={product.id}>
                  <ProductTile product={product} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
