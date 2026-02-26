import React from "react";
import ProjectCard from "./ProjectCard";

export default function ProjectsSection({ projects = [], openPreview }) {
  // Force 2 columns at all viewport sizes
  return (
    <div className="grid grid-cols-2 gap-6">
      {projects.map((p) => (
        <ProjectCard
          key={p.id || p._id}
          project={p}
          onView={openPreview}
        />
      ))}
    </div>
  );
}
