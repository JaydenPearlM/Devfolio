import React from "react";
import AboutJayden from "../../component/AboutJayden";
import DeltaPetsCard from "../../component/DeltaPetsCard";
import ProjectCard from "../../component/ProjectCard";

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
      {/* Top Construction Banner */}
      <div className="md:col-span-3 w-full bg-black/80 border-b border-cyan-300/40 px-4 py-3 text-center rounded-lg">
        <p className="text-lg md:text-xl font-black tracking-wide text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]">
          Sorry For the Current Mess! We are still in construction! Hopefully we shall be up and running soon!
        </p>
      </div>

      {/* Left Column */}
      <aside className="w-full md:col-[1/2] md:pl-1 md:-ml-2 flex flex-col gap-6">
        <DeltaPetsCard />
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

      {/* Project Cards */}
      <section className="w-full md:col-[3/4]">
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