// src/pages/ProjectGallery.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listAllProjects, deleteProjectById } from "../lib/supaProjects";

/** Normalize tags to a lowercase string array */
function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }
  return String(tags)
    .split(/[,\n]/g)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/** True if any tag includes the query substring */
function tagsMatch(project, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return normalizeTags(project.tags).some((t) => t.includes(q));
}

export default function ProjectGallery({ onEdit, refreshKey = 0 }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔎 Search UI (live + submit)
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      const rows = await listAllProjects();
      setProjects(Array.isArray(rows) ? rows : []);
      setError("");
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [refreshKey]);

  // 💨 Live-search: debounce searchInput -> submittedQuery (200ms)
  useEffect(() => {
    const id = setTimeout(() => setSubmittedQuery(searchInput), 200);
    return () => clearTimeout(id);
  }, [searchInput]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await deleteProjectById(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      alert(e?.message || "Delete failed");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSubmittedQuery("");
  };

  const visible = useMemo(() => {
    if (!submittedQuery.trim()) return projects;
    return projects.filter((p) => tagsMatch(p, submittedQuery));
  }, [projects, submittedQuery]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="font-['Inter']">
      {/* Title */}
      <h1
        className="text-blue-600 mb-2 text-4xl md:text-4xl"
        style={{ fontFamily: "'Oswald', sans-serif", lineHeight: 1.2 }}
      >
        Project Gallery
      </h1>

      {/* Refresh button — shifted to the right slightly */}
      <div className="mt-6 mb-3 flex justify-start">
        <button
          type="button"
          onClick={refresh}
          title="Refresh project list"
          aria-label="Refresh project list"
          className="ml-2 px-3 py-1 rounded border bg-green-300 text-green-700 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-200"
        >
          Refresh
        </button>
      </div>

      {/* 🔎 SEARCH BAR ABOVE THE LIST (live) */}
      <form
        onSubmit={handleSearchSubmit}
        className="mb-4 p-3 border rounded bg-white flex gap-2 items-center"
      >
        <input
          type="text"
          placeholder="Search by tag (e.g., react)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") clearSearch();
          }}
          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 caret-indigo-600"
          aria-label="Tag search input"
          autoFocus
        />

        {/* 🌿 Search button — pastel green to complement blue & yellow palette */}
        <button
          type="submit"
          className="px-4 py-2 rounded border bg-green-300 text-green-700 hover:bg-green-200 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-200"
          aria-label="Submit tag search"
        >
          Search
        </button>

        {submittedQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-3 py-2 border rounded hover:bg-gray-50 transition-colors duration-200"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </form>

      {submittedQuery && (
        <div className="mb-2 text-sm">
          Showing projects with tag containing:{" "}
          <span className="font-medium">{submittedQuery}</span>
        </div>
      )}

      <ul className="space-y-2">
        {visible.map((p) => {
          const tags = normalizeTags(p.tags);
          return (
            <li
              key={p.id}
              className="flex justify-between items-center p-3 rounded border bg-white"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">{p.title}</div>
                {tags.length > 0 && (
                  <div className="text-sm text-gray-600 truncate">
                    {tags.join(", ")}
                  </div>
                )}
              </div>

              <div className="shrink-0 flex gap-2">
                {/* EDIT — pastel yellow base */}
                <button
                  className="px-2 py-1 rounded border border-yellow-200 bg-yellow-100 text-black hover:bg-yellow-200 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors duration-200"
                  onClick={() =>
                    onEdit?.({
                      id: p.id,
                      title: p.title,
                      description: p.description,
                      skills: p.skills,
                      github_link: p.github_link || p.githubLink,
                      web_app_url: p.web_app_url || p.websiteUrl || p.demo_url,
                      tags: p.tags,
                      time: p.time,
                      __raw: p,
                    })
                  }
                >
                  Edit
                </button>

                {/* DELETE — pastel red base */}
                <button
                  className="px-2 py-1 rounded border bg-red-200 text-red-700 hover:bg-red-200 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors duration-200"
                  onClick={() => handleDelete(p.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}

        {visible.length === 0 && (
          <li className="p-3 text-gray-500">No projects found.</li>
        )}
      </ul>
    </div>
  );
}
