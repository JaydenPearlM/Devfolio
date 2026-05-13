import React, { useEffect } from "react";
import { recordPageview } from "../lib/analytics";
import "./deltaPetsAlphaPage.css";

export default function deltaPetsAlphaPage() {
  useEffect(() => {
    try {
      recordPageview("/deltapets");
    } catch {
      // analytics should never crash page render
    }
  }, []);

  return (
    <div className="w-full min-h-screen px-4 md:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1
            className="
              text-5xl md:text-7xl font-oswald font-bold mb-3
              bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300
              bg-clip-text text-transparent
            "
          >
            DeltaPets
          </h1>

          <p
            className="text-xl md:text-2xl font-semibold mb-2"
            style={{ color: "var(--ink)" }}
          >
            Browser Based Pet Sim
          </p>

          <p
            className="text-lg md:text-xl font-bold mb-4"
            style={{ color: "var(--muted)" }}
          >
            Alpha Development
          </p>
        </div>

        {/* For Players Section */}
        <section className="dp-neon-panel dp-neon-panel--green mb-10 ml-8">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold mb-6 dp-neon-heading">
            For Players
          </h2>

          <div className="space-y-5 text-base md:text-lg leading-relaxed dp-panel-text">
            <p>
              DeltaPets is a browser based pet simulation game where players
              hatch, raise, train, and bond with unique creatures called{" "}
              <strong className="dp-highlight-cyan">Kith</strong>. Every Kith
              grows through care, personality, elemental identity, and player
              choices.
            </p>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">
                Hatch Your Kith
              </h3>
              <p>
                Begin your journey by hatching a Kith with its own personality,
                elemental affinity, strengths, and growth path. No two
                companions are meant to feel exactly the same.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">
                Daily Care & Progression
              </h3>
              <p>
                Feed, clean, train, and care for your Kith to shape how it
                develops. Consistent care improves growth, unlocks progression
                opportunities, and prepares your companion for future battles.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">
                Build Your Team
              </h3>
              <p>
                Raise multiple Kith and experiment with different elements,
                personalities, and combat roles. Team composition, care history,
                and long term progression all matter.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">
                Prepare for Battle
              </h3>
              <p>
                Train your Kith for upcoming PvE systems across Aliune,
                including Instabilities, Flux Events, mini bosses, and
                exploration encounters. Battles focus on strategy, progression,
                and skill synergy.
              </p>
            </div>

            <div className="mt-8 p-5 rounded-lg dp-inner-glow">
              <p
                className="text-center font-semibold"
                style={{ color: "var(--ui-trans-ink)" }}
              >
                Experience a pet sim built around bonding, daily care,
                exploration, and meaningful growth. No downloads. No
                installation. Open your browser and enter Aliune.
              </p>
            </div>
          </div>
        </section>

        <div className="dp-alpha-showcase-grid">
          {/* For Developers / Recruiters Section */}
          <section className="dp-neon-panel dp-neon-panel--purple dp-alpha-showcase-card dp-alpha-showcase-card--left">
            <h2 className="text-3xl md:text-4xl font-oswald font-bold mb-6 dp-neon-heading">
              For Developers & Recruiters
            </h2>

            <div className="space-y-5 text-base md:text-lg leading-relaxed dp-panel-text">
              <p>
                DeltaPets is a full stack engineering project built to
                demonstrate scalable web architecture, modular gameplay systems,
                live persistence, backend integration, and production focused
                development practices.
              </p>

              <div>
                <h3 className="text-xl font-bold mb-3 dp-subheading-pink">
                  Tech Stack
                </h3>

                <ul className="space-y-2 ml-5">
                  <li className="flex items-start">
                    <span className="dp-bullet mr-2">•</span>
                    <span>
                      <strong>Frontend:</strong> React, TypeScript, Vite, and
                      modular UI component architecture
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="dp-bullet mr-2">•</span>
                    <span>
                      <strong>Backend:</strong> Node.js and Express API
                      architecture
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="dp-bullet mr-2">•</span>
                    <span>
                      <strong>Database:</strong> Supabase PostgreSQL with auth
                      connected persistence
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="dp-bullet mr-2">•</span>
                    <span>
                      <strong>Authentication:</strong> Secure player ownership
                      and gameplay state validation
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="dp-bullet mr-2">•</span>
                    <span>
                      <strong>Deployment:</strong> Render planning with closed
                      alpha testing workflows
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 p-5 rounded-lg dp-inner-glow">
                <p
                  className="text-center font-semibold"
                  style={{ color: "var(--ui-trans-ink)" }}
                >
                  DeltaPets demonstrates scalable architecture planning, AI
                  assisted testing, and full stack development.
                </p>
              </div>
            </div>
          </section>

          {/* Coming Features Section */}
          <section className="dp-neon-panel dp-neon-panel--green dp-alpha-showcase-card">
            <h2 className="text-3xl md:text-4xl font-oswald font-bold mb-6 dp-neon-heading">
              Coming Features
            </h2>

            <div className="space-y-4 dp-panel-text">
              <div className="dp-feature-card">
                <h3 className="font-bold text-lg mb-2 dp-subheading-pink">
                  Evolving Kith Forms
                </h3>
                <p className="text-sm">
                  Watch Kith transform through growth stages, unlocking new
                  visual forms and stronger abilities.
                </p>
              </div>

              <div className="dp-feature-card">
                <h3 className="font-bold text-lg mb-2 dp-subheading-pink">
                  Skill Systems
                </h3>
                <p className="text-sm">
                  Unlock and master powerful skills through training, care, and
                  progression.
                </p>
              </div>

              <div className="dp-feature-card">
                <h3 className="font-bold text-lg mb-2 dp-subheading-pink">
                  Future Expansions
                </h3>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="dp-bullet mr-2">•</span>
                    <span>Hatch generation and starter Kith validation</span>
                  </li>

                  <li className="flex items-start">
                    <span className="dp-bullet mr-2">•</span>
                    <span>Authentication state and player ownership</span>
                  </li>

                  <li className="flex items-start">
                    <span className="dp-bullet mr-2">•</span>
                    <span>Frontend, backend, and Supabase persistence</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="dp-neon-panel dp-neon-panel--purple dp-alpha-footer-banner">
          <p className="text-lg font-bold" style={{ color: "var(--ink)" }}>
            Experience a pet sim built around growth, care, and evolution.
          </p>

          <p className="text-base font-bold" style={{ color: "var(--muted)" }}>
            No in-app purchases. No ads. Just pure fun.
          </p>
        </div>
      </div>
    </div>
  );
}