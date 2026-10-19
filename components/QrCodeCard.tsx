"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/site";

const QR_OPTIONS = {
  margin: 2,
  color: { dark: "#0b2b3a", light: "#ffffff" },
  errorCorrectionLevel: "M" as const,
};

export default function QrCodeCard() {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(SITE_URL, { ...QR_OPTIONS, width: 240 }).then(setPreview);
  }, []);

  async function download() {
    // Large version so it stays sharp when printed on signs.
    const dataUrl = await QRCode.toDataURL(SITE_URL, { ...QR_OPTIONS, width: 1200 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "hugostoyz-qr-code.png";
    link.click();
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-bold text-htz-navy">QR Code</h2>
      <p className="mt-1 text-sm text-htz-navy/60">
        Scanning this with a phone camera opens {SITE_URL}. Print it on market signs, business
        cards or packaging.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="QR code linking to the HugosToyz website" width={160} height={160} />
        ) : (
          <div className="h-40 w-40 animate-pulse rounded-lg bg-htz-navy/5" />
        )}
        <button
          type="button"
          onClick={download}
          className="rounded-full bg-htz-orange px-6 py-2 font-display font-bold text-white shadow transition-transform hover:scale-[1.02] active:scale-95"
        >
          Download QR code (PNG)
        </button>
      </div>
    </div>
  );
}
