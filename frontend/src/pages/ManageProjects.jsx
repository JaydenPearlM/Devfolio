// devfolio-client/src/pages/ManageProjects.jsx
import React, { useState, useCallback } from "react";
import AddProjectForm from "../components/AddProjectForm";
import ProjectGallery from "./ProjectGallery";

export default function ManageProjects() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: "",
    githubLink: "",
    websiteUrl: "",
    tags: "",
    time: "",
    existingThumbUrl: "",
    existingProjectFiles: [],
    existingCodeFileName: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      skills: "",
      githubLink: "",
      websiteUrl: "",
      tags: "",
      time: "",
      existingThumbUrl: "",
      existingProjectFiles: [],
      existingCodeFileName: "",
    });
    setIsEditing(false);
    setEditingId(null);
  }, []);

  const onEditRow = useCallback((rowMaybeMapped) => {
    const p = rowMaybeMapped.__raw || rowMaybeMapped;

    setIsEditing(true);
    setEditingId(p.id);

    const existingThumbUrl =
      p.thumbnail_url || p.thumb_url || p.thumbnail || p.thumbnailUrl || "";
    const existingProjectFiles = Array.isArray(p.project_files)
      ? p.project_files.map((f) =>
          typeof f === "string" ? { name: f, url: f } : f
        )
      : [];
    const existingCodeFileName =
      p.code_filename || p.code_name || p.codeFileName || p.code || "";

    setFormData({
      title: p.title || "",
      description: p.description || "",
      skills: p.skills || "",
      githubLink: p.github_link || p.github_url || p.githubLink || "",
      websiteUrl:
        p.web_app_url || p.webb_app_url || p.websiteUrl || p.demo_url || "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
      time: p.time || "",
      existingThumbUrl,
      existingProjectFiles,
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
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Upload Projects — keep inner blue border, no white gap */}
      <div className="border-4 border-blue-300 rounded-2xl shadow-sm p-0 bg-transparent">
        <AddProjectForm
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          editingId={editingId}
          onSave={onSaved}
          onCancelEdit={onCancelEdit}
        />
      </div>

      {/* Right: Project Gallery — blue frame with white interior */}
      <div className="border-4 border-blue-300 rounded-2xl shadow-sm p-1 bg-transparent">
        <div className="rounded-xl bg-white p-5 sm:p-6 md:p-7 h-full">
          <ProjectGallery onEdit={onEditRow} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
