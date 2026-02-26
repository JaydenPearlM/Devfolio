import React from "react";
import AboutJayden from "../AboutJayden";
import ProjectCard from "../ProjectCard";

export default function HomeDesktopLayout({
  projects,
  error,
  setInfoOpen,
}) {
  return (
    <div
      className="
        flex flex-col gap-6 items-start
        md:grid md:grid-cols-[1fr_8px_1.2fr] md:gap-x-6
        rounded-lg shadow-lg
      "
    >
      {/* Left Column */}
      <aside className="w-full md:col-[1/2] md:pl-1 md:-ml-2">
        <AboutJayden className="md:min-h-fit" />
      </aside>

      {/* Divider */}
      <div
        className="
          hidden md:block
          md:col-[2/3]
          w-px md:w-[4px]
          rounded-full
          bg-gradient-to-b from-green-200 via-green-300 to-green-400
        "
      />

      {/* Right Column */}
      <section className="w-full md:col-[3/4] relative">
        {/* Title + How To Use button row */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-3xl font-oswald font-bold text-white">
            Project Gallery
          </h2>

          <button
            className="
              hidden md:inline-flex items-center gap-2 rounded-md 
              border px-3 py-1.5 text-sm font-semibold
              bg-purple-500 hover:bg-purple-600 text-white border-purple-600
              shadow-sm hover:shadow-md transition-all
            "
            onClick={() => setInfoOpen(true)}
          >
            How to Use The Cards
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}

          {projects.length === 0 && !error && (
            <p className="col-span-full text-gray-300 text-center py-10">
              No projects yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
