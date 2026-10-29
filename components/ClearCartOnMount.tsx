"use client";

import { useEffect } from "react";
import { clearSavedCart } from "@/lib/cart-context";

export default function ClearCartOnMount() {
  useEffect(() => {
    clearSavedCart();
  }, []);
  return null;
}
