import { ImageResponse } from "next/og";

export const alt = "HugosToyz – 3D printed fidget toys and custom gifts, made in Australia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b2b3a 0%, #103c45 55%, #0b2b3a 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 110, fontWeight: 700 }}>
          Hugos<span style={{ color: "#c6f53e" }}>Toyz</span>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 52, fontWeight: 700 }}>
          3D printed fidget toys &amp; custom gifts
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 34, color: "rgba(255,255,255,0.8)" }}>
          Printed and finished by hand in Australia
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            width: 220,
            height: 14,
            borderRadius: 7,
            background: "linear-gradient(90deg, #ff4d94, #ff6a1a)",
          }}
        />
      </div>
    ),
    size
  );
}
