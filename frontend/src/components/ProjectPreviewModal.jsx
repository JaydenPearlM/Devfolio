// src/components/ProjectPreviewModal.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Square modal that renders a site (HTML + assets) in an iframe.
 *
 * Props:
 *   - variant?: "website" | "demo" (default: "website")
 *   - url?: string                // used when variant === "website"
 *   - files?: string[]            // used when variant === "demo"
 *   - title?: string
 *   - onClose?: () => void
 *
 * Notes:
 * - Works with your current ProjectsPage usage:
 *     <ProjectPreviewModal url={previewUrl} onClose={() => setPreviewUrl("")} />
 * - "demo" variant will pick index.html from the files list, else any .html.
 * - Includes a refresh button that cache-busts via a query param.
 */

function pickHtmlFromFiles(files) {
  if (!Array.isArray(files) || files.length === 0) return null;
  const idx = files.find((f) => /\/index\.html?(\?|#|$)/i.test(String(f)));
  if (idx) return idx;
  return files.find((f) => /\.html?(\?|#|$)/i.test(String(f))) || null;
}

function folderOf(url) {
  return url ? url.replace(/[^/]+$/, "") : "";
}

export default function ProjectPreviewModal({
  variant = "website",
  url,
  files,
  title,
  onClose,
}) {
  // Is the modal open?
  const isOpen = useMemo(() => {
    if (variant === "website") return Boolean(url);
    if (variant === "demo") return Array.isArray(files) && files.length > 0;
    return false;
  }, [variant, url, files]);

  // Decide initial src (website URL or best HTML from files)
  const initialSrc = useMemo(() => {
    if (variant === "website") return url || null;
    if (variant === "demo") return pickHtmlFromFiles(files) || null;
    return null;
  }, [variant, url, files]);

  const [buster, setBuster] = useState(0);
  const label = variant === "website" ? "Website Preview" : "Interactive Demo";
  const headerTitle = title || folderOf(initialSrc || "") || "Untitled";

  // Close on Esc
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const srcWithBust =
    initialSrc &&
    `${initialSrc}${initialSrc.includes("?") ? "&" : "?"}_=${buster}`;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="
          w-[92vmin] max-w-[95vw]
          h-[92vmin] max-h-[90vh]
          bg-white rounded-2xl shadow-2xl overflow-hidden
          border border-blue-200 relative
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-blue-100/70 bg-blue-50/50">
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-800">
              {headerTitle} <span className="text-slate-500 font-normal">• {label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBuster((b) => b + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-[.98] transition"
              title="Refresh preview"
              type="button"
              disabled={!initialSrc}
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 active:scale-[.98] transition"
              title="Close"
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        {/* Square preview */}
        <div className="w-full h-[calc(100%-3rem)] bg-slate-50 p-2">
          {initialSrc ? (
            <iframe
              key={buster}
              src={srcWithBust}
              className="w-full h-full border border-purple-300 rounded-xl bg-white"
              title={`${headerTitle} ${label}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-white" />
          )}
        </div>
      </div>
    </div>
  );
}
