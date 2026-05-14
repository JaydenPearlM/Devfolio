// src/components/AboutJayden.jsx
import React from "react";

export default function AboutJayden() {
  return (
    <section id="about" className="relative mt-5 w-full">
      <div
        className="
          relative w-full overflow-hidden rounded-2xl
          border border-white/25
          bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ui-trans-a)_22%,transparent),color-mix(in_srgb,var(--ui-trans-b)_18%,transparent)_48%,color-mix(in_srgb,var(--ui-trans-c)_20%,transparent))]
          text-white
          shadow-[0_16px_34px_rgba(0,0,0,0.28),0_0_34px_rgba(var(--accent-rgb),0.22)]
          p-6 md:p-8
          backdrop-blur-xl
        "
      >
        <div
          className="
            absolute inset-0 opacity-38
            bg-[radial-gradient(circle_at_15%_16%,rgba(255,255,255,0.42),transparent_28%),radial-gradient(circle_at_88%_8%,color-mix(in_srgb,var(--ui-trans-b)_18%,transparent),transparent_30%),radial-gradient(circle_at_8%_92%,color-mix(in_srgb,var(--ui-trans-c)_20%,transparent),transparent_32%)]
          "
        />

        <div
          className="
            absolute top-6 right-6
            w-40 h-40
            opacity-[0.07]
            pointer-events-none
            rotate-[12deg]
          "
        >
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M100 10L185 170H15L100 10Z"
              stroke="white"
              strokeWidth="12"
              strokeLinejoin="round"
            />

            <path d="M100 55L145 140H55L100 55Z" fill="white" />
          </svg>
        </div>

        <div
          className="
            absolute inset-[15px]
            rounded-[1rem]
            border-[6px] border-[rgba(192,132,252,0.75)]
            pointer-events-none
          "
        />

        <div className="relative z-10 max-w-4xl">
          <div
  className="
    mb-6
    text-center
    text-xs font-black uppercase tracking-[0.2em]
    text-[var(--dp-skill-purple)]
  "
>
  Devfolio Profile
</div>

          <h2
            className="
              text-3xl md:text-4xl
              font-black
              tracking-[-0.04em]
              leading-[0.95]
              mb-3
            "
            style={{
              color: "#ffcf61",
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
              tracking-[0.08em]
              leading-[1.1]
              text-cyan-100
              mb-5
            "
          >
            Full-Stack Software Engineer
          </p>

          <div className="text-slate-100/85 leading-relaxed text-base md:text-lg space-y-4">
            <p>
              I build full stack applications that combine scalable engineering,
              polished UI systems, and thoughtful product design. My work covers
              frontend architecture, backend APIs, database systems, deployment
              workflows, analytics tracking, and the interaction details that
              make software feel intentional and complete.
            </p>

            <p>
              My background in Art & Design gives me a strong focus on layout,
              readability, visual hierarchy, responsiveness, and user
              experience. I care about performance and maintainability, but I
              also care about how software feels when people use it. Clean
              systems matter, but so does creating an experience that feels
              smooth, modern, and cohesive.
            </p>

            <p>
              DeltaPets is the strongest example of how I approach development.
              The project combines game systems, frontend engineering, backend
              architecture, analytics tooling, AI assisted workflows, automation
              systems, and long term feature planning inside one evolving
              production environment.
            </p>

            <p>
              I enjoy building software that balances technical structure with
              creativity. My goal is not only to make systems functional, but to
              make them intuitive, visually polished, scalable, and enjoyable to
              interact with.
            </p>
          </div>

          <div
            className="
              relative
              mt-7 pt-5
              rounded-2xl
              border border-cyan-200/20
              px-5 pb-5
            "
          >
            <div
              className="
                absolute inset-[5px]
                rounded-[0.9rem]
                border-[3px] border-cyan-200/35
                pointer-events-none
              "
            />

            <h3
              className="
                relative z-10
                text-sm md:text-base
                uppercase
                tracking-[0.22em]
                font-black
                text-[var(--dp-skill-purple)]
                mb-5
                text-center
              "
            >
              My Tech Stack
            </h3>

            <div
              className="
                relative z-10
                flex flex-col gap-3
                text-sm md:text-base
                text-white/85
                leading-relaxed
                text-center
                font-semibold
              "
            >
              <p>React • TypeScript • JavaScript • Node.js • Express</p>

              <p>Supabase • PostgreSQL • SQL • Python • C++</p>

              <p>VS Code • GitHub • REST APIs • Vite • Responsive UI Systems</p>

              <p>Agile Methodology • Full Stack Architecture • Database Design</p>

              <p>Analytics Logging • Automation Systems • AI Assisted Workflows</p>

              <p>Claude Automation • Scheduled Health Audits • Vector LLM Systems</p>

              <p className="text-right pr-1 text-cyan-100/80 font-semibold">
                Render for Deployment
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}