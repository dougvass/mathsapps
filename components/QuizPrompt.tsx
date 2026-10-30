"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SEEN_KEY = "htz-quiz-prompt";
const DELAY_MS = 10000;
// Only where people are browsing, not while they're buying.
const PAGES = ["/", "/shop"];

// "Not sure what to get?" card for first-time visitors, shown once.
export default function QuizPrompt() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Phones get no pop-ups; the quiz is in the menu instead.
    if (!PAGES.includes(pathname) || !window.matchMedia("(min-width: 640px)").matches) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => {
      // Don't pop up over another pop-up (like the prize wheel).
      if (document.querySelector('[aria-modal="true"]')) return;
      setShow(true);
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Fidget quiz"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-htz-pink p-4 text-white shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-6"
    >
      <span className="text-4xl" aria-hidden="true">🧩</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold leading-tight">Not sure what to get?</p>
        <p className="text-sm text-white/90">3 quick questions = your perfect fidget.</p>
        <Link
          href="/quiz"
          onClick={() => setShow(false)}
          className="mt-2 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[#7c3aed] shadow"
        >
          Take the quiz →
        </Link>
      </div>
      <button type="button" onClick={() => setShow(false)} aria-label="Close" className="self-start text-xl text-white/80 hover:text-white">
        ✕
      </button>
    </div>
  );
}
