import React, { useCallback, useState } from "react";
import AddProjectForm from "../component/AddProjectForm";
import ProjectGallery from "../component/ProjectGallery";
import { createEmptyProjectFormState } from "../utils/projectFormState";
import "./ManageProjects.css";

export default function ManageProjects() {
  const [formData, setFormData] = useState(createEmptyProjectFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetForm = useCallback(() => {
    setFormData(createEmptyProjectFormState());
    setIsEditing(false);
    setEditingId(null);
  }, []);

  const onEditRow = useCallback((projectLike) => {
    const p = projectLike?.__raw || projectLike || {};

    const existingThumbUrl =
      p.thumbnail_url || p.thumb_url || p.thumbnail || p.thumbnailUrl || "";

    const existingProjectFiles = Array.isArray(p.project_files)
      ? p.project_files.map((f) =>
          typeof f === "string" ? { name: f, url: f } : f
        )
      : [];

    const existingCodeFileName =
      p.code_filename || p.code_name || p.codeFileName || p.code || "";

    setIsEditing(true);
    setEditingId(p.id ?? null);

    setFormData({
      title: p.title || "",
      description: p.description || "",
      skills: p.skills || "",
      software: p.software || "",
      githubLink: p.github_link || p.github_url || p.githubLink || "",
      websiteUrl:
        p.web_app_url || p.webb_app_url || p.websiteUrl || p.demo_url || "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
      time: p.time || "",
      existingThumbUrl,
      existing_project_files: existingProjectFiles,
      existingCodeFileName,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onSaved = useCallback(() => {
    resetForm();
    setRefreshKey((k) => k + 1);
  }, [resetForm]);

  const onCancelEdit = useCallback(() => {
    resetForm();
    setRefreshKey((k) => k + 1);
  }, [resetForm]);

  return (
    <div className="p-4 md:p-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Upload Projects Panel - No outer border, 4px inset */}
        <section className="dp-transSurface rounded-[30px] p-6 sm:p-7 mp-upload-no-border mp-upload-inset">
          <AddProjectForm
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            editingId={editingId}
            onSave={onSaved}
            onCancelEdit={onCancelEdit}
          />
        </section>

        {/* Project Gallery Panel - Keep original border */}
        <section className="dp-transSurface rounded-[30px] p-6 sm:p-7 min-h-[720px]">
          <ProjectGallery onEdit={onEditRow} refreshKey={refreshKey} />
        </section>
      </div>
    </div>
  );
}
