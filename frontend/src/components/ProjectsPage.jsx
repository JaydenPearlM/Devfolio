// src/components/ProjectsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import AddProjectForm from "./AddProjectForm";
import { listSupaProjects, deleteProjectById } from "../lib/supaProjects";
import DemoModal from "./modals/DemoModal";
import ProjectPreviewModal from "./ProjectPreviewModal"; // make sure this path matches your file

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  // Keep using string ("" = closed) so it matches your ProjectPreviewModal usage
  const [previewUrl, setPreviewUrl] = useState("");

  // Demo modal (renders full site from project_files)
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoFiles, setDemoFiles] = useState([]);

  // Load projects from Supabase (Devfolio table)
  async function loadProjects() {
    try {
      setError("");
      const rows = await listSupaProjects({ limit: 100 });
      setProjects(rows);
    } catch (e) {
      console.error("Failed to load projects:", e);
      setError(e.message || "Failed to load projects.");
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  // When the left form saves, optimistically prepend the new row
  const onSaved = (row) => {
    if (!row) return;
    setProjects((prev) => [row, ...prev]);
  };

  // Delete with confirm + prune from list
  const handleDelete = async (proj) => {
    if (!proj) return;
    if (!window.confirm(`Delete "${proj.title}"?`)) return;

    try {
      await deleteProjectById(proj.id);
      setProjects((prev) => prev.filter((p) => p.id !== proj.id));
    } catch (e) {
      console.error(e);
      alert(e.message || "Delete failed");
    }
  };

  /* ---------------- Helpers ---------------- */

  const toArray = (v) =>
    Array.isArray(v)
      ? v.map(String).filter(Boolean)
      : String(v || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

  const isIndexHtml = (u) => /\/index\.html?(\?|$)/i.test(String(u));
  const isHtml = (u) => /\.html?(\?|$)/i.test(String(u));

  // Gather all possible project file fields → one deduped array
  const collectProjectFiles = (proj) => {
    const a = [
      ...toArray(proj.project_files),
      ...toArray(proj.projectFiles),
      ...toArray(proj.existing_project_files),
    ];
    return Array.from(new Set(a));
  };

  // Choose best preview url (for your existing "View" modal)
  const getPreviewUrl = (proj) => {
    // 1) Explicit URLs already stored
    const explicit =
      (proj.websiteUrl ||
        proj.web_app_url ||
        proj.webb_app_url ||
        proj.demo_index_url ||
        proj.project_index_url ||
        "").trim();
    if (explicit) return explicit;

    // 2) Otherwise, try to find an index.html among uploaded project files
    const files = collectProjectFiles(proj);
    const idx = files.find(isIndexHtml);
    if (idx) return idx;

    // 3) Fallback: any html (pick shallowest path)
    const htmls = files.filter(isHtml);
    if (htmls.length) {
      const shallow = htmls
        .map((u) => ({ u, segs: String(u).split("/").length }))
        .sort((a, b) => a.segs - b.segs)[0]?.u;
      return shallow || "";
    }
    return "";
  };

  // View → open iframe modal (ProjectPreviewModal) instead of new tab
  const handleView = (proj) => {
    const url = getPreviewUrl(proj);
    if (!url) {
      alert("No live demo found. Upload a folder with index.html or set a Website URL.");
      return;
    }
    setPreviewUrl(url); // string (truthy) opens the modal
  };

  // Demo → opens DemoModal with project_files list
  const handleDemo = (proj) => {
    const files = collectProjectFiles(proj);
    if (!files.length) {
      alert("No demo files yet. Upload a folder or zip containing an index.html.");
      return;
    }
    setDemoFiles(files);
    setDemoOpen(true);
  };

  // Code → open code file (or repo) in new tab
  const handleCode = (proj) => {
    const code =
      (proj.codeFile || proj.code_file || proj.code_url || "").trim();
    if (!code) {
      alert("No code file found. Attach a code file on upload or set a repository URL.");
      return;
    }
    window.open(code, "_blank", "noopener,noreferrer");
  };

  // Simple search across common fields
  const filteredProjects = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    if (!q) return projects;

    return projects.filter((p) => {
      const hay = [
        p.title,
        p.skills,
        Array.isArray(p.tags) ? p.tags.join(" ") : p.tags,
        p.githubLink,
        p.websiteUrl,
        p.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [projects, searchTerm]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6">
      {/* Upload form (left column) */}
      <div className="lg:w-1/3 w-full">
        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        {/* IMPORTANT: our AddProjectForm expects onSave */}
        <AddProjectForm onSave={onSaved} />
      </div>

      {/* Project gallery (right column) */}
      <div className="lg:w-2/3 w-full">
        <h2 className="text-2xl font-semibold mb-4">Project Gallery:</h2>

        <input
          type="text"
          placeholder="Search title/tags/skills…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 w-full p-2 border rounded"
        />

        <table className="w-full text-left mb-6 text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Title</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((proj) => (
              <tr key={proj.id} className="border-b hover:bg-gray-100">
                <td className="p-2">{proj.title}</td>
                <td className="p-2 space-x-2">
                  {/* Demo: renders from project_files list */}
                  <button
                    type="button"
                    onClick={() => handleDemo(proj)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="Open interactive demo (project_files)"
                  >
                    Demo
                  </button>

                  {/* View: open iframe modal */}
                  <button
                    type="button"
                    onClick={() => handleView(proj)}
                    className="px-3 py-1 bg-blue-200 text-blue-900 rounded hover:bg-blue-300"
                    title="View (live demo)"
                  >
                    View
                  </button>

                  {/* Code: open code file/repo */}
                  <button
                    type="button"
                    onClick={() => handleCode(proj)}
                    className="px-3 py-1 bg-violet-200 text-violet-900 rounded hover:bg-violet-300"
                    title="Open code file"
                  >
                    Code
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(proj)}
                    className="px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredProjects.length === 0 && (
              <tr>
                <td colSpan={2} className="p-2 text-gray-500">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Iframe modal preview (string "" closes it) */}
      <ProjectPreviewModal url={previewUrl} onClose={() => setPreviewUrl("")} />

      {/* Demo modal (renders full site from project_files) */}
      <DemoModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        files={demoFiles}
      />
    </div>
  );
}
