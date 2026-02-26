// devfolio-client/src/components/ProjectCard.jsx
import React from "react";
import { recordProjectClick } from "../lib/analytics";
import DemoModal from "./modals/DemoModal";
import CodeModal from "./modals/CodeModal";

/* ---------- small helpers ---------- */
function splitList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

// Robust: accepts array, JSON-stringified array, or comma string
function toArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    return s
      .split(",")
      .map((x) => x.trim().replace(/^(\[)?"+|"+(\])?$/g, "")) // strip stray quotes/brackets
      .filter(Boolean);
  }
  return [];
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function pickThumb(project) {
  return (
    project?.thumbnail ||
    project?.thumbnailUrl ||
    project?.existingThumbUrl ||
    project?.thumnail || // legacy typo
    null
  );
}

export default function ProjectCard({ project /* onView optional */ }) {
  if (!project) return null;

  const id = project.id ?? project._id ?? "";
  const title = project.title ?? "Untitled";
  const description = project.description ?? "";

  const githubUrl = (project.githubLink ?? project.github_link ?? "").trim();

  // Code file (uploaded to 'uploads' bucket) to show in modal
  const codeUrl = (
    project.code_file ||
    project.codeFile ||
    project.code_url ||
    ""
  ).trim();

  const thumb = pickThumb(project);
  const skills = splitList(project.skillsArray ?? project.skills);
  const tags = splitList(project.tagsArray ?? project.tags);

  // Uploaded site assets for Demo (Supabase-hosted)
  const demoFiles = uniq([
    ...toArr(project.project_files),
    ...toArr(project.projectFiles),
    ...toArr(project.existing_project_files),
  ]);
  const hasDemoFiles = demoFiles.length > 0;

  // Derived index.html hosted on Supabase (for Demo)
  const indexUrl = (project.project_index_url || project.demo_index_url || "").trim();
  const hasIndexUrl = !!indexUrl;

  // EXTERNAL deployed website ONLY (this drives the "View" button)
  const websiteUrl = (
    project.websiteUrl ||
    project.web_app_url ||
    project.webb_app_url ||
    ""
  ).trim();
  const hasExternalWebsite = !!websiteUrl;

  function log(kind) {
    try {
      recordProjectClick(id || title || "unknown", { title, kind });
    } catch {}
  }

  // Local modal state
  const [demoOpen, setDemoOpen] = React.useState(false);
  const [codeOpen, setCodeOpen] = React.useState(false);

  // Show Demo whenever we have Supabase-hosted files or index.html
  const canShowDemo = hasDemoFiles || hasIndexUrl;

  return (
    <>
      <div
        className="
          group
          w-full rounded-3xl
          shadow-[0_12px_25px_rgba(0,0,0,0.25)]
          bg-gradient-to-br from-purple-200 via-blue-300 to-pink-200
          ring-1 ring-blue-300/50
          p-6 md:p-8
          relative
          before:content-[''] before:absolute before:inset-[6px] before:rounded-2xl
          before:pointer-events-none before:border before:border-white/70
          before:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]

          transform-gpu will-change-transform
          motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)]
          hover:scale-[1.03] hover:-translate-y-1
          hover:shadow-[0_22px_45px_rgba(0,0,0,0.35)]
          hover:z-20
          focus-within:scale-[1.03] focus-within:-translate-y-1
          active:scale-[1.01]

          motion-reduce:transition-none motion-reduce:hover:transform-none
        "
      >
        {/* LEFT: buttons | RIGHT: thumbnail */}
        <div className="flex items-center justify-center gap-6">
          {/* Buttons stack (tighten spacing on small screens) */}
          <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => log("github")}
                className="px-5 py-2 rounded-full bg-slate-700 text-white text-sm font-medium shadow-sm hover:bg-slate-800 hover:shadow-md transition"
              >
                GitHub
              </a>
            )}

            {canShowDemo && (
              <button
                type="button"
                onClick={() => {
                  log("demo");
                  setDemoOpen(true);
                }}
                className="px-5 py-2 rounded-full bg-blue-500 text-white text-sm font-medium shadow-sm hover:bg-blue-600 hover:shadow-md transition"
              >
                Demo
              </button>
            )}

            {/* VIEW now ONLY for external deployed sites */}
            {hasExternalWebsite && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => log("view")}
                className="px-5 py-2 rounded-full bg-sky-400 text-white text-sm font-medium shadow-sm hover:bg-sky-500 hover:shadow-md transition"
              >
                View
              </a>
            )}

            {/* CODE opens inline modal viewer (never used for View) */}
            {codeUrl && (
              <button
                type="button"
                onClick={() => {
                  log("code");
                  setCodeOpen(true);
                }}
                className="px-5 py-2 rounded-full bg-purple-300 text-white text-sm font-medium shadow-sm hover:bg-purple-400 hover:shadow-md transition"
              >
                Code
              </button>
            )}
          </div>

          {/* Thumbnail — responsive sizes for mobile/tablet/desktop */}
          {thumb ? (
            <div
              className="
                aspect-square
                w-28 sm:w-36 md:w-44 lg:w-56
                rounded-2xl overflow-hidden border border-blue-200 shadow-inner
              "
            >
              <img
                src={thumb}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="
                aspect-square
                w-28 sm:w-36 md:w-44 lg:w-56
                rounded-2xl border border-blue-200 grid place-items-center text-slate-400
              "
            >
              No preview
            </div>
          )}
        </div>

        {/* Title + Description — hover tooltip for full text */}
        <div className="mt-6">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight line-clamp-1 md:pl-1 md:pr-3">
            {title}
          </h3>

          {description ? (
            <div className="relative group/desc">
              {/* Clamped description (what you see by default) */}
              <p className="mt-3 text-slate-700/90 leading-relaxed line-clamp-4 pl-1 md:pr-3 text-sm sm:text-base">
                {description}
              </p>

              {/* Hover popup with full description */}
              <div
                className="
                  hidden group-hover/desc:block
                  absolute left-0 right-0
                  mt-2 z-30
                  rounded-xl
                  bg-slate-900/95
                  text-slate-50
                  text-xs sm:text-sm
                  p-3
                  shadow-xl
                  whitespace-pre-line
                "
              >
                {description}
              </div>
            </div>
          ) : null}
        </div>

        {/* Bottom row: Skills | Tags */}
        <div className="mt-6 pt-4 border-t border-blue-200 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7">
            <div className="text-sm font-semibold text-slate-800 mb-2">Skills</div>
            {skills.length ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 border border-blue-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-sm">—</div>
            )}
          </div>

          <div className="md:col-span-5 md:text-right">
            <div className="text-sm font-semibold text-slate-800 mb-2">Tags</div>
            {tags.length ? (
              <div className="flex flex-wrap gap-2 md:justify-end">
                {tags.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs rounded-full bg-pink-100 text-pink-700 border border-pink-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-sm md:text-right">—</div>
            )}
          </div>
        </div>
      </div>

      {/* Demo iframe modal (Supabase-hosted assets) */}
      {canShowDemo && (
        <DemoModal
          open={demoOpen}
          onClose={() => setDemoOpen(false)}
          files={demoFiles}
          indexUrl={indexUrl}
          title={title}
        />
      )}

      {/* Code modal (renders uploaded code_file) */}
      {codeUrl && (
        <CodeModal
          open={codeOpen}
          url={codeUrl}
          title={title || "Code"}
          onClose={() => setCodeOpen(false)}
        />
      )}
    </>
  );
}
