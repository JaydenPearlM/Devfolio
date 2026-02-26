// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  const v = process.env.REACT_APP_VERSION || "1.2.0-Beta";

  // Same gradient as your ProjectCards / TopBanner
  const CARD_GRAD = "bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-400";

  return (
    <footer
     className={`
        fixed bottom-0 left-0 w-full
        ${CARD_GRAD}
        text-center py-3 text-xs text-blue-900
        border-t border-white/20
        shadow-[0_-6px_12px_rgba(0,0,0,0.15)]
        z-[50]              /* stays above all content */
      `}
    >
      <p className="tracking-wide">
        © {year} Jayden Maxwell · All Rights Reserved ·{" "}
        <a href="/privacy" className="underline hover:text-blue-900 transition-colors">
          Privacy
        </a>{" "}
        ·{" "}
        <a href="/terms" className="underline hover:text-blue-900 transition-colors">
          Terms
        </a>{" "}
        · v{v}
      </p>
    </footer>
  );
}

