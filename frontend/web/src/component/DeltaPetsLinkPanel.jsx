import React from "react";

const DELTAPETS_SITE_URL = "https://github.com/JaydenPearlM/Deltapets-site/tree/main";

export default function DeltaPetsLinkPanel() {
  return (
    <section className="deltaPetsLinkPanel" aria-labelledby="deltapets-link-title">
      <div className="deltaPetsLinkPanel__eyebrow">Featured Game Project</div>

      <h3 id="deltapets-link-title" className="deltaPetsLinkPanel__title">
        DeltaPets
      </h3>

      <p className="deltaPetsLinkPanel__text">
        A browser-based pet sim where players hatch, care for, train, and battle
        with creatures called Kith. Built with React, TypeScript, Node, Express,
        and Supabase.
      </p>

      <a
        className="deltaPetsLinkPanel__button"
        href={DELTAPETS_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        View DeltaPets
      </a>
    </section>
  );
}
