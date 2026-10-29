"use client";

import { useEffect } from "react";

// A friend's link (?ref=CODE) is remembered for 30 days, so it counts if they sign up later.
export default function ReferralCatcher() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code && /^[A-Za-z0-9]{4,16}$/.test(code)) {
      document.cookie = `htz_ref=${code.toUpperCase()}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    }
  }, []);
  return null;
}
