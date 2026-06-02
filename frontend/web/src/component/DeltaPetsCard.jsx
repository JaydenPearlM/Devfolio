import React from "react";
import { useNavigate } from "react-router-dom";

export default function DeltaPetsCard() {
  const navigate = useNavigate();

  return (
    <div
      className="
        relative w-full rounded-2xl overflow-hidden
        border-[4px] border-transparent
        bg-[linear-gradient(135deg,var(--ui-trans-a),var(--ui-trans-b)_48%,var(--ui-trans-c))]
        bg-clip-padding
        text-[#1e293b]
        shadow-[0_16px_34px_rgba(0,0,0,0.28),0_0_34px_rgba(var(--accent-rgb),0.28)]
        hover:shadow-[0_20px_44px_rgba(0,0,0,0.34),0_0_46px_rgba(var(--accent-rgb),0.38)]
        transition-all duration-300
        p-6 md:p-8
      "
    >
      <div
        aria-hidden="true"
        className="
          absolute inset-0 rounded-2xl
          border-[4px] border-transparent
          bg-[linear-gradient(135deg,rgba(139,92,246,0.95),rgba(116,201,234,0.68),rgba(251,207,232,0.85),rgba(139,92,246,0.9))]
          [mask:linear-gradient(#000_0_0)_padding-box,linear-gradient(#000_0_0)]
          [mask-composite:exclude]
          pointer-events-none
        "
      />

      <div
        className="
          absolute inset-0 opacity-45
          bg-[radial-gradient(circle_at_15%_16%,rgba(255,255,255,0.68),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(var(--accent-rgb),0.26),transparent_30%),radial-gradient(circle_at_8%_92%,rgba(116,201,234,0.35),transparent_32%)]
        "
      />

      <div
        className="
          absolute inset-[15px]
          rounded-[1rem]
          border-[4px] border-transparent
          bg-[linear-gradient(135deg,rgba(139,92,246,0.62),rgba(116,201,234,0.38),rgba(251,207,232,0.55),rgba(139,92,246,0.58))]
          [mask:linear-gradient(#000_0_0)_padding-box,linear-gradient(#000_0_0)]
          [mask-composite:exclude]
          shadow-[inset_0_0_22px_rgba(139,92,246,0.14)]
          pointer-events-none
        "
      />

      <div
        aria-hidden="true"
        className="
          absolute right-[-34px] top-[-34px] z-10
          text-[13rem] md:text-[16rem]
          font-black
          leading-none
          rotate-[18deg]
          text-purple-600/30
          drop-shadow-[0_0_22px_rgba(139,92,246,0.28)]
          pointer-events-none
          select-none
        "
      >
        ★
      </div>

      <div className="relative z-10 max-w-4xl">
        <div className="mb-4 text-center">
          <span
            className="
              text-lg md:text-xl
              font-black uppercase tracking-[0.18em]
              text-[#ffcf61]
              [-webkit-text-stroke:1px_#8b0000]
              drop-shadow-[0_0_8px_rgba(255,207,97,0.45)]
            "
          >
            Featured Game Project
          </span>
        </div>

        <h2
          className="
            text-3xl md:text-4xl
            font-black
            tracking-[-0.04em]
            leading-[0.95]
            mb-4
            text-[#ffcf61]
            [-webkit-text-stroke:1px_#8b0000]
            drop-shadow-[0_0_8px_rgba(255,207,97,0.45)]
          "
          style={{
            fontFamily: '"Space Mono", system-ui, monospace',
          }}
        >
          DeltaPets: Raise. Train. Evolve. Bond.
        </h2>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-5">
          DeltaPets is a full stack browser game built around scalable gameplay
          systems, long term progression, and interactive companion mechanics.
          Built with React, TypeScript, Express, and Supabase, the project
          combines frontend engineering, backend architecture, persistent data
          systems, and modular game design inside one evolving production
          environment.
        </p>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-5">
          Every Kith is procedurally unique. Core systems include stat variance,
          personality driven growth patterns, elemental affinity calculations,
          timestamp based care systems with server side validation, and
          progression paths that shape how each Kith develops over time.
        </p>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-6">
          Closed Alpha testing begins on{" "}
          <span className="font-bold">June 14; current Alpha is a closed Alpha for ten people to gtest the game.</span>. The first playable build
          focuses on account creation, Mystery Egg hatching, Kith profiles,
          bonding systems, care mechanics, and the foundation for future combat
          and evolution updates.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          <div className="relative rounded-xl bg-white/45 border border-white/45 p-5">
            <div className="pointer-events-none absolute inset-[5px] rounded-lg border border-cyan-300/80 shadow-[inset_0_0_14px_rgba(34,211,238,0.45)]" />

            <div className="relative z-10">
              <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
                Features
              </p>

              <p className="mt-1 font-semibold text-[#334155]/90">
                Procedurally generated Kith, dynamic stat systems, personality
                driven progression, timestamp based care mechanics, and scalable
                gameplay architecture designed for long term expansion.
              </p>
            </div>
          </div>

          <div className="relative rounded-xl bg-white/45 border border-white/45 p-5">
            <div className="pointer-events-none absolute inset-[5px] rounded-lg border border-cyan-300/80 shadow-[inset_0_0_14px_rgba(34,211,238,0.45)]" />

            <div className="relative z-10">
              <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
                It is gonna be wild!
              </p>

              <p className="mt-1 font-semibold text-[#334155]/90">
                Raise a living companion that grows through trust, daily care,
                progression, evolution, and future battle systems. Every Kith
                develops differently based on how players interact with them
                over time.
              </p>
            </div>
          </div>

          <div className="relative rounded-xl bg-white/45 border border-white/45 p-5">
            <div className="pointer-events-none absolute inset-[5px] rounded-lg border border-cyan-300/80 shadow-[inset_0_0_14px_rgba(34,211,238,0.45)]" />

            <div className="relative z-10">
              <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
                Tech Stack
              </p>

              <p className="mt-1 font-semibold text-[#334155]/90">
                Vite, React, TypeScript, Node.js, Express, Supabase,
                PostgreSQL, REST APIs, and pnpm Monorepo.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/deltapets")}
          className="
            group relative inline-flex items-center gap-2
            px-6 py-3 rounded-lg
            bg-[linear-gradient(90deg,var(--blue-700),var(--accent))]
            hover:brightness-110
            text-white font-bold text-lg
            shadow-[0_0_22px_rgba(var(--accent-rgb),0.38)]
            hover:shadow-[0_0_32px_rgba(var(--accent-rgb),0.55)]
            transition-all duration-300
            transform hover:scale-105
          "
        >
          <span>View DeltaPets</span>
          <svg
            className="w-5 h-5 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}