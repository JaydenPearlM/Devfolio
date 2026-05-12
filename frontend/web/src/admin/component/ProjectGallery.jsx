import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { listAllProjects } from "../../lib/supaProjects";

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function deleteProjectFromServer(id) {
  const token = await getAuthToken();

  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Delete failed.");
  }

  return data;
}

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

function tagsMatch(project, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return normalizeTags(project.tags).some((t) => t.includes(q));
}

function splitList(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProjectGallery({ onEdit, refreshKey = 0 }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  useEffect(() => {
    const id = setTimeout(() => {
      setSubmittedQuery(searchInput);
    }, 180);

    return () => clearTimeout(id);
  }, [searchInput]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;

    try {
      await deleteProjectFromServer(id);
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

  const visibleProjects = useMemo(() => {
    if (!submittedQuery.trim()) return projects;
    return projects.filter((p) => tagsMatch(p, submittedQuery));
  }, [projects, submittedQuery]);

  if (loading) {
    return (
      <div className="font-['Inter'] text-slate-900">
        <h1
          className="mb-5 text-4xl md:text-5xl text-[#2f55d4]"
          style={{ fontFamily: "'Space Mono', monospace", lineHeight: 1 }}
        >
          Project Gallery
        </h1>

        <div className="rounded-2xl bg-[rgba(255,255,255,0.52)] p-4 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-['Inter']">
        <h1
          className="mb-5 text-4xl md:text-5xl text-[#2f55d4]"
          style={{ fontFamily: "'Space Mono', monospace", lineHeight: 1 }}
        >
          Project Gallery
        </h1>

        <div className="rounded-2xl bg-red-100/85 p-4 text-red-700 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="font-['Inter'] text-slate-900">
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1
            className="text-4xl md:text-5xl text-[#2f55d4]"
            style={{ fontFamily: "'Space Mono', monospace", lineHeight: 1 }}
          >
            Project Gallery
          </h1>

          <button
            type="button"
            onClick={refresh}
            title="Refresh project list"
            aria-label="Refresh project list"
            className="
              px-4 py-2 rounded-xl
              bg-emerald-200/85 text-emerald-950
              hover:bg-emerald-200
              transition font-semibold shadow-sm
            "
          >
            Refresh
          </button>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="
            rounded-2xl
            bg-[rgba(255,255,255,0.50)]
            p-3 flex gap-2 items-center flex-wrap
            shadow-[0_10px_24px_rgba(15,23,42,0.08)]
          "
        >
          <input
            type="text"
            placeholder="Search by tag"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") clearSearch();
            }}
            className="
              flex-1 min-w-[220px]
              p-3 rounded-xl
              bg-[rgba(255,255,255,0.80)]
              text-slate-900
              outline-none
              focus:ring-4 focus:ring-sky-200/40
            "
            aria-label="Tag search input"
          />

          <button
            type="submit"
            className="
              px-4 py-3 rounded-xl
              bg-emerald-200/85 text-emerald-950
              hover:bg-emerald-200
              transition font-semibold
            "
            aria-label="Submit tag search"
          >
            Search
          </button>

          {submittedQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="
                px-4 py-3 rounded-xl
                bg-white/85 text-slate-700
                hover:bg-white
                transition font-semibold
              "
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <ul className="space-y-3">
        {visibleProjects.map((p) => {
          const tags = normalizeTags(p.tags);
          const software = splitList(p.software);

          return (
            <li
              key={p.id}
              className="
                rounded-2xl
                bg-[linear-gradient(180deg,rgba(229,220,245,0.82)_0%,rgba(201,218,255,0.76)_100%)]
                shadow-[0_10px_24px_rgba(15,23,42,0.10)]
                p-4
              "
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold text-slate-900 truncate">
                    {p.title || "Untitled Project"}
                  </div>

                  {(tags.length > 0 || software.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <span
                          key={`tag-${tag}-${idx}`}
                          className="
                            inline-flex items-center rounded-full
                            bg-sky-100/90 px-3 py-1
                            text-xs font-semibold text-sky-900
                          "
                        >
                          #{tag}
                        </span>
                      ))}

                      {software.slice(0, 4).map((item, idx) => (
                        <span
                          key={`software-${item}-${idx}`}
                          className="
                            inline-flex items-center rounded-full
                            bg-violet-100/90 px-3 py-1
                            text-xs font-semibold text-violet-900
                          "
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex gap-2 self-start">
                  <button
                    type="button"
                    className="
                      px-3 py-2 rounded-xl
                      bg-amber-100/95 text-slate-900
                      hover:bg-amber-200
                      transition font-semibold
                    "
                    onClick={() =>
                      onEdit?.({
                        id: p.id,
                        title: p.title,
                        description: p.description,
                        skills: p.skills,
                        software: p.software,
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

                  <button
                    type="button"
                    className="
                      px-3 py-2 rounded-xl
                      bg-rose-100/95 text-rose-700
                      hover:bg-rose-200
                      transition font-semibold
                    "
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}

        {visibleProjects.length === 0 && (
          <li
            className="
              rounded-2xl
              bg-[rgba(255,255,255,0.52)]
              p-5 text-slate-700
              shadow-[0_10px_24px_rgba(15,23,42,0.08)]
            "
          >
            No projects found.
          </li>
        )}
      </ul>
    </div>
  );
}
