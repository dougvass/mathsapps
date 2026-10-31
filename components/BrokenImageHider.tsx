"use client";

import { useEffect } from "react";

// Hides any of our uploaded photos that fail to load (e.g. while storage is
// paused), so pages show their colours instead of broken-picture icons.
export default function BrokenImageHider() {
  useEffect(() => {
    const hide = (img: HTMLImageElement) => {
      if (img.src.includes("/api/images/")) img.style.visibility = "hidden";
    };
    document.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) hide(img);
    });
    const onError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) hide(event.target);
    };
    window.addEventListener("error", onError, true);
    return () => window.removeEventListener("error", onError, true);
  }, []);
  return null;
}
