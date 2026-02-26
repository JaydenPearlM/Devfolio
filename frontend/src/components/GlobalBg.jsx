// src/components/GlobalBg.jsx
import React from "react";

export default function GlobalBg() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: `
          radial-gradient(circle at 60% 38%, rgba(120, 90, 220, 0.35) 0%, rgba(120, 90, 220, 0.15) 22%, transparent 55%),
          radial-gradient(circle at 45% 30%, #2e3a7b 0%, #191b3e 55%, #090a17 100%)
        `,
        backgroundSize: "180% 180%, 160% 160%",
        backgroundRepeat: "no-repeat",
        filter: "brightness(1.03)",
      }}
    />
  );
}
