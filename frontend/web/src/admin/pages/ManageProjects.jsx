import React, { useCallback, useState } from "react";
import AddProjectForm from "../component/AddProjectForm";
import ProjectGallery from "../component/ProjectGallery";
import { createEmptyProjectFormState } from "../utils/projectFormState";

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
        <section
          className="
            rounded-[30px]
            bg-[linear-gradient(180deg,rgba(226,213,243,0.88)_0%,rgba(197,217,255,0.80)_100%)]
            shadow-[0_14px_34px_rgba(15,23,42,0.18)]
            p-4 sm:p-5
          "
        >
          <AddProjectForm
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            editingId={editingId}
            onSave={onSaved}
            onCancelEdit={onCancelEdit}
          />
        </section>

        <section
          className="
            rounded-[30px]
            bg-[linear-gradient(180deg,rgba(226,213,243,0.88)_0%,rgba(197,217,255,0.80)_100%)]
            shadow-[0_14px_34px_rgba(15,23,42,0.18)]
            p-4 sm:p-5
            min-h-[720px]
          "
        >
          <ProjectGallery onEdit={onEditRow} refreshKey={refreshKey} />
        </section>
      </div>
    </div>
  );
}