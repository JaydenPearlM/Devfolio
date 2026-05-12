import React from "react";
import { useNavigate } from "react-router-dom";

export default function DeltaPetsCard() {
  const navigate = useNavigate();

  return (
    <div
      className="
        relative w-full rounded-2xl overflow-hidden
        border-[4px] border-transparent
bg-clip-padding
        bg-[linear-gradient(135deg,var(--ui-trans-a),var(--ui-trans-b)_48%,var(--ui-trans-c))]
        text-[#1e293b]
        shadow-[0_16px_34px_rgba(0,0,0,0.28),0_0_34px_rgba(var(--accent-rgb),0.28)]
        hover:shadow-[0_20px_44px_rgba(0,0,0,0.34),0_0_46px_rgba(var(--accent-rgb),0.38)]
        transition-all duration-300
        p-6 md:p-8
      "
    >
      <div
        className="
          absolute inset-0 opacity-45
          bg-[radial-gradient(circle_at_15%_16%,rgba(255,255,255,0.68),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(var(--accent-rgb),0.26),transparent_30%),radial-gradient(circle_at_8%_92%,rgba(116,201,234,0.35),transparent_32%)]
        "
      />

      <div
        className="
          absolute inset-[6px]
          rounded-[1rem]
          border border-cyan-200/55
          shadow-[inset_0_0_0_1px_rgba(139,92,246,0.18),inset_0_0_22px_rgba(139,92,246,0.14)]
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
        <div className="inline-block mb-3">
          <span
            className="
              px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              bg-white/80 text-[#1e293b]
              shadow-[0_0_18px_rgba(255,255,255,0.22)]
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
          "
          style={{
            color: "#000000",
            fontFamily: '"Space Mono", system-ui, monospace',
          }}
        >
          DeltaPets
        </h2>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-5">
          DeltaPets is a browser-based pet simulation game set in Aliune, where
          players hatch eggs, raise creatures called{" "}
          <span className="font-bold">Kith</span>, manage care needs, train
          stats, unlock evolutions, and prepare for battles.
        </p>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-5">
          The story begins with corrupted eggs appearing across the world. Most
          hatch empty, but a rare shadow Kith may emerge. Players are pulled into
          the mystery while building trust with their own Kith through care,
          training, and progression.
        </p>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-6">
          Closed Alpha testing begins on{" "}
          <span className="font-bold">June 14</span>. The Alpha focuses on the
          first playable experience: hatching, bonding, caring, growing, and
          preparing the foundation for future battles and deeper story content.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Features
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Hatch eggs, raise Kith, manage care, train stats, and evolve.
            </p>
          </div>

          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Why Play
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Build a bond with your Kith while uncovering the corruption
              mystery.
            </p>
          </div>

          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Tech Stack
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Supabase, React, TypeScript, Express, Node
            </p>
          </div>
        </div>

        <button
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
          absolute inset-[6px]
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
        <div className="inline-block mb-3">
          <span
            className="
              px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              bg-white/80 text-[#1e293b]
              shadow-[0_0_18px_rgba(255,255,255,0.22)]
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
          "
          style={{
            color: "#000000",
            fontFamily: '"Space Mono", system-ui, monospace',
          }}
        >
          DeltaPets
        </h2>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-5">
          DeltaPets is a browser-based pet simulation game set in Aliune, where
          players hatch eggs, raise creatures called{" "}
          <span className="font-bold">Kith</span>, manage care needs, train
          stats, unlock evolutions, and prepare for battles.
        </p>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-5">
          The story begins with corrupted eggs appearing across the world. Most
          hatch empty, but a rare shadow Kith may emerge. Players are pulled into
          the mystery while building trust with their own Kith through care,
          training, and progression.
        </p>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-6">
          Closed Alpha testing begins on{" "}
          <span className="font-bold">June 14</span>. The Alpha focuses on the
          first playable experience: hatching, bonding, caring, growing, and
          preparing the foundation for future battles and deeper story content.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Features
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Hatch eggs, raise Kith, manage care, train stats, and evolve.
            </p>
          </div>

          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Why Play
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Build a bond with your Kith while uncovering the corruption
              mystery.
            </p>
          </div>

          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Tech Stack
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Supabase, React, TypeScript, Express, Node
            </p>
          </div>
        </div>

        <button
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
          absolute inset-[6px]
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
        <div className="inline-block mb-3">
          <span
            className="
              px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              bg-white/80 text-[#1e293b]
              shadow-[0_0_18px_rgba(255,255,255,0.22)]
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
          "
          style={{
            color: "#000000",
            fontFamily: '"Space Mono", system-ui, monospace',
          }}
        >
          DeltaPets
        </h2>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-5">
          DeltaPets is a browser-based pet simulation game set in Aliune, where
          players hatch eggs, raise creatures called{" "}
          <span className="font-bold">Kith</span>, manage care needs, train
          stats, unlock evolutions, and prepare for battles.
        </p>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-5">
          The story begins with corrupted eggs appearing across the world. Most
          hatch empty, but a rare shadow Kith may emerge. Players are pulled into
          the mystery while building trust with their own Kith through care,
          training, and progression.
        </p>

        <p className="text-[#1e293b]/85 text-base md:text-lg leading-relaxed mb-6">
          Closed Alpha testing begins on{" "}
          <span className="font-bold">June 14</span>. The Alpha focuses on the
          first playable experience: hatching, bonding, caring, growing, and
          preparing the foundation for future battles and deeper story content.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Features
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Hatch eggs, raise Kith, manage care, train stats, and evolve.
            </p>
          </div>

          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Why Play
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Build a bond with your Kith while uncovering the corruption
              mystery.
            </p>
          </div>

          <div className="rounded-xl bg-white/45 border border-white/45 p-3">
            <p className="text-xs uppercase tracking-widest font-bold text-[#1e293b]/60">
              Tech Stack
            </p>
            <p className="mt-1 font-semibold text-[#1e293b]">
              Supabase, React, TypeScript, Express, Node
            </p>
          </div>
        </div>

        <button
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