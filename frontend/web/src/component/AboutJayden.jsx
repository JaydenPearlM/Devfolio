// src/components/AboutJayden.jsx
import React from "react";

export default function AboutJayden() {
  return (
    <section id="about" className="relative mt-5 w-full">
      <div
        className="
          relative w-full rounded-2xl overflow-hidden
          border border-white/25
          bg-[linear-gradient(135deg,var(--ui-trans-a),var(--ui-trans-b)_48%,var(--ui-trans-c))]
          text-[#1e293b]
          shadow-[0_16px_34px_rgba(0,0,0,0.28),0_0_34px_rgba(var(--accent-rgb),0.22)]
          p-6 md:p-8
        "
      >
        <div
          className="
            absolute inset-0 opacity-40
            bg-[radial-gradient(circle_at_15%_16%,rgba(255,255,255,0.62),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(var(--accent-rgb),0.22),transparent_30%),radial-gradient(circle_at_8%_92%,rgba(116,201,234,0.3),transparent_32%)]
          "
        />

        <div
          className="
            absolute inset-[6px]
            rounded-[1rem]
            border border-white/35
            pointer-events-none
          "
        />

        <div className="relative z-10 max-w-4xl">
          <h2
            className="
              text-3xl md:text-4xl
              font-black
              tracking-[-0.04em]
              leading-[0.95]
              mb-3
            "
            style={{
              color: "#000000",
              fontFamily: '"Space Mono", system-ui, monospace',
            }}
          >
            About the Developer:
            <br />
            Jayden M.
          </h2>

          <p
            className="
              text-lg md:text-xl
              font-black
              font-['Space_Mono']
              tracking-[-0.04em]
              leading-[1]
              text-[#1e293b]
              mb-5
            "
          >
            Full-Stack Software Engineer
          </p>

          <div className="text-[#1e293b]/85 leading-relaxed text-base md:text-lg space-y-4">
            <p>
              I build full-stack web applications that mix clean engineering,
              useful features, and strong visual design. My work covers React
              interfaces, API integrations, backend logic, database structure,
              deployment pipelines, and the UI polish that makes software feel
              finished.
            </p>

            <p>
              My Art & Design background gives me a creative edge. I care about
              layout, readability, interaction flow, performance, and the tiny
              details most people only notice when they are missing. That is the
              good stuff. Tiny details, big impact.
            </p>

            <p>
              DeltaPets is the best example of how I like to work: game design,
              product thinking, frontend systems, backend architecture, and
              long-term feature planning all living in one real project. I do
              not just want code to run. I want it to feel good to use.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1e293b]/15">
            <p className="text-sm md:text-base text-[#1e293b]/75 leading-relaxed">
              React • Node.js • Express • Supabase • PostgreSQL • TypeScript •
              JavaScript • Python • C++ • SQL • Software Architecture • Agile
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}