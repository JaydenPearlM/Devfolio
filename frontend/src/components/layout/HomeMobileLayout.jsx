// src/components/layout/HomeMobileLayout.jsx
import React from "react";
import AboutJayden from "../AboutJayden";
import ProjectCard from "../ProjectCard";

export default function HomeMobileLayout({
  projects,
  error,
  setInfoOpen,
}) {
  return (
    <div
      className="
        flex flex-col gap-6
        w-full max-w-[480px]
        mx-auto
        px-3
      "
    >
      {/* About Me */}
      <AboutJayden />

      {/* Projects header row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <h2 className="text-3xl font-oswald font-bold text-white">
          Project Gallery
        </h2>

        <button
          className="
            inline-flex items-center gap-1
            px-2 py-1
            text-xs font-semibold
            sm:text-sm
            rounded-md
            bg-purple-500 hover:bg-purple-600
            text-white border border-purple-600
            shadow-sm hover:shadow-md
            transition-all
            whitespace-nowrap
          "
          onClick={() => setInfoOpen(true)}
        >
          How to Use The Cards
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {/* Projects */}
      <div className="grid grid-cols-1 gap-4">
        {projects.map((proj) => (
          <ProjectCard key={proj.id} project={proj} />
        ))}
      </div>

      {projects.length === 0 && !error && (
        <p className="text-gray-300 text-center py-10">No projects yet.</p>
      )}
    </div>
  );
}
