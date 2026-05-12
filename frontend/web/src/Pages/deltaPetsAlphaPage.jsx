import React, { useEffect } from "react";
import { recordPageview } from "../lib/analytics";
import "./DeltaPetsAlphaPage.css";

export default function DeltaPetsAlphaPage() {
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
              text-5xl md:text-7xl font-oswald font-bold mb-4
              bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300
              bg-clip-text text-transparent
            "
          >
            DeltaPets
          </h1>
          <p className="text-xl md:text-2xl font-semibold"
             style={{ color: 'var(--ink)' }}>
            Browser-Based Pet Sim | Alpha Development
          </p>
        </div>

        {/* For Players Section */}
        <section className="dp-neon-panel dp-neon-panel--cyan mb-10">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold mb-6 dp-neon-heading">
            For Players
          </h2>

          <div className="space-y-5 text-base md:text-lg leading-relaxed dp-panel-text">
            <p>
              DeltaPets is a browser-based pet simulation game where you raise, train, and battle with unique creatures called <strong className="dp-highlight-cyan">Kith</strong>. 
              Every Kith is yours to discover, nurture, and grow into a powerful companion.
            </p>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">Hatch Your Kith</h3>
              <p>
                Begin your journey by hatching your very own Kith. Each creature emerges with its own personality, elemental affinity, 
                and unique stats that shape how it grows and battles.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">Daily Care & Progression</h3>
              <p>
                Care for your Kith daily to keep it happy and healthy. Feed, play, and train to unlock growth traits and watch 
                your companion evolve. A well-cared-for Kith grows stronger and unlocks new abilities.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">Build Your Team</h3>
              <p>
                Collect and raise multiple Kith to build a balanced team. Discover synergies between different elements, 
                personalities, and skill sets. Each Kith brings something unique to your roster.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">Prepare for Battle</h3>
              <p>
                Train your team and prepare for upcoming battle systems. Strategic team composition and daily care will determine 
                your success. Master elemental advantages and skill combinations to dominate.
              </p>
            </div>

            <div className="mt-8 p-5 rounded-lg dp-inner-glow">
              <p className="text-center font-semibold" style={{ color: 'var(--ui-trans-ink)' }}>
                Experience a pet sim built around progression, daily care, and meaningful choices. No downloads. No installation. 
                Just open your browser and start your journey.
              </p>
            </div>
          </div>
        </section>

        {/* For Developers / Recruiters Section */}
        <section className="dp-neon-panel dp-neon-panel--purple mb-10">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold mb-6 dp-neon-heading">
            For Developers & Recruiters
          </h2>

          <div className="space-y-5 text-base md:text-lg leading-relaxed dp-panel-text">
            <p>
              DeltaPets is a full-stack engineering project showcasing modern web development practices, 
              scalable architecture, and production-ready systems.
            </p>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">Tech Stack</h3>
              <ul className="space-y-2 ml-5">
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span><strong>Frontend:</strong> React, TypeScript, modern UI component architecture</span>
                </li>
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span><strong>Backend:</strong> Node.js, Express API with RESTful endpoints</span>
                </li>
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span><strong>Database:</strong> Supabase (PostgreSQL) with auth integration</span>
                </li>
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span><strong>State Management:</strong> Auth-connected gameplay persistence</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 dp-subheading-pink">Engineering Highlights</h3>
              <ul className="space-y-2 ml-5">
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span>Pet creation and hatching logic with randomized trait generation</span>
                </li>
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span>Time-based care decay system with server-side validation</span>
                </li>
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span>Modular project structure built for scalability and maintainability</span>
                </li>
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span>Frontend UI systems fully connected to backend game logic</span>
                </li>
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span>Deployment planning and closed alpha preparation workflow</span>
                </li>
                <li className="flex items-start">
                  <span className="dp-bullet mr-2">•</span>
                  <span>RESTful API design with authentication and authorization layers</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 p-5 rounded-lg dp-inner-glow">
              <p className="text-center font-semibold" style={{ color: 'var(--ui-trans-ink)' }}>
                This project demonstrates full-stack capabilities: frontend development, backend API design, 
                database architecture, authentication systems, and deployment planning.
              </p>
            </div>
          </div>
        </section>

        {/* Vague Cool Features Section */}
        <section className="dp-neon-panel dp-neon-panel--green mb-10">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold mb-6 dp-neon-heading">
            Coming Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 dp-panel-text">
            <div className="dp-feature-card">
              <h3 className="font-bold text-lg mb-2 dp-subheading-pink">Evolving Kith Forms</h3>
              <p className="text-sm">
                Watch your Kith transform as they grow, unlocking new visual forms and enhanced abilities.
              </p>
            </div>

            <div className="dp-feature-card">
              <h3 className="font-bold text-lg mb-2 dp-subheading-pink">Elemental Identity</h3>
              <p className="text-sm">
                Each Kith possesses a unique elemental affinity that influences battles and interactions.
              </p>
            </div>

            <div className="dp-feature-card">
              <h3 className="font-bold text-lg mb-2 dp-subheading-pink">Skill Systems</h3>
              <p className="text-sm">
                Unlock and master powerful skills through training and care progression.
              </p>
            </div>

            <div className="dp-feature-card">
              <h3 className="font-bold text-lg mb-2 dp-subheading-pink">Care-Based Progression</h3>
              <p className="text-sm">
                Your daily care directly impacts growth, unlocking unique traits and abilities.
              </p>
            </div>

            <div className="dp-feature-card">
              <h3 className="font-bold text-lg mb-2 dp-subheading-pink">Battle Preparation</h3>
              <p className="text-sm">
                Strategic team building and training systems for upcoming competitive battles.
              </p>
            </div>

            <div className="dp-feature-card">
              <h3 className="font-bold text-lg mb-2 dp-subheading-pink">Player-Owned Teams</h3>
              <p className="text-sm">
                Build and customize your roster of Kith with unique team synergies.
              </p>
            </div>

            <div className="dp-feature-card">
              <h3 className="font-bold text-lg mb-2 dp-subheading-pink">Future Alpha Testing</h3>
              <p className="text-sm">
                Join closed alpha testing to experience early features and shape development.
              </p>
            </div>

            <div className="dp-feature-card">
              <h3 className="font-bold text-lg mb-2 dp-subheading-pink">Browser-Native Play</h3>
              <p className="text-sm">
                No downloads. No installation. Play anywhere with just a web browser.
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="text-center py-8">
          <p className="text-lg mb-4" style={{ color: 'var(--ink)' }}>
            DeltaPets is currently in active development.
          </p>
          <p className="text-base" style={{ color: 'var(--muted)' }}>
            A passion project combining game design with full-stack engineering.
          </p>
        </div>
      </div>
    </div>
  );
}
