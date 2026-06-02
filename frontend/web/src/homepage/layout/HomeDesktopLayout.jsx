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
        md:grid md:grid-cols-[minmax(320px,0.95fr)_8px_minmax(0,1.50fr)] md:gap-x-6
        rounded-lg shadow-lg
      "
    >
      {/* Left Column */}
      <aside className="w-full md:col-[1/2] md:pl-12 md:pr-2 md:pt-[40px] mb-[30px] flex flex-col gap-8">
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
     <section className="w-full md:col-[3/4] md:-ml-10 md:pt-[40px]">
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