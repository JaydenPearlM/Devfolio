// devfolio-client/src/components/modals/DemoModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const HTML_EXT = /\.html?(\?|#|$)/i;

function pickBestHtml(files) {
  if (!Array.isArray(files) || files.length === 0) return null;
  const idx = files.find((u) => /\/index\.html(\?|#|$)/i.test(String(u)));
  if (idx) return idx;
  return files.find((u) => HTML_EXT.test(String(u))) || null;
}
function folderName(u) {
  if (!u) return "";
  const parts = String(u).split("/").filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[parts.length - 1] || "";
}
function baseHrefOf(htmlUrl) {
  if (!htmlUrl) return "";
  const i = htmlUrl.lastIndexOf("/");
  return i >= 0 ? htmlUrl.slice(0, i + 1) : htmlUrl;
}

export default function DemoModal({
  open,
  onClose,
  files = [],
  indexUrl = "",
  title,
}) {
  // Prefer explicit indexUrl; otherwise find best HTML in files
  const startUrl = useMemo(() => {
    if (!open) return null;
    if (indexUrl) return indexUrl;
    return pickBestHtml(files);
  }, [open, indexUrl, files]);

  const headerTitle = title || folderName(startUrl) || "Untitled";
  const [buster, setBuster] = useState(0);
  const [srcDoc, setSrcDoc] = useState("");

  const bustedUrl = startUrl
    ? `${startUrl}${startUrl.includes("?") ? "&" : "?"}_=${buster}`
    : "";

  // Close on Escape
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Fetch HTML and inject <base> so relative assets resolve
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!open || !startUrl) {
        setSrcDoc("");
        return;
      }
      try {
        const res = await fetch(bustedUrl, { credentials: "omit", mode: "cors" });
        const raw = await res.text();

        const base = `<base href="${baseHrefOf(startUrl)}">`;
        let doc = raw;
        if (/<head[^>]*>/i.test(raw)) {
          if (!/<base\s[^>]*href=/i.test(raw)) {
            doc = raw.replace(/<head[^>]*>/i, (m) => `${m}\n${base}`);
          }
        } else {
          doc = `<!doctype html><html><head>${base}</head><body>${raw}</body></html>`;
        }

        if (!cancelled) setSrcDoc(doc);
      } catch {
        if (!cancelled) {
          setSrcDoc(`<!doctype html><html><body>
            <div style="padding:16px;font:14px system-ui;color:#334;">
              Failed to load preview.
            </div>
          </body></html>`);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, startUrl, bustedUrl]);

  if (!open) return null;

  return createPortal(
    <div
      className="
        fixed inset-0 
        z-[11000]
        bg-black/70 
        flex items-center justify-center p-2 sm:p-4
      "
      style={{ zIndex: 15000 }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Outer shell: gradient frame */}
      <div
        className="
          w-[92vmin] max-w-[95vw]
          h-[92vmin] max-h-[90vh]
          rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.45)]
          overflow-hidden relative
          bg-gradient-to-br from-[#6a50ff] via-[#a77bff] to-[#ff8aa6]
          p-3
          animate-[fadeIn_120ms_ease-out]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner bezel */}
        <div className="w-full h-full rounded-xl bg-[#e9d9ff] border border-[#c9afff] shadow-inner">
          {/* Header */}
          <div className="flex items-center justify-between h-12 px-4 border-b border-[#ccb7ff] bg-[#f1e8ff]">
            <div className="truncate font-semibold text-[#1b1b22] text-sm sm:text-base">
              {headerTitle}{" "}
              <span className="text-[#5b5b76] font-normal">• Interactive Demo</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuster((b) => b + 1)}
                className="px-3 py-1.5 rounded-lg border border-[#c9afff] bg-white text-[#28283a] hover:bg-[#f7f2ff] active:scale-[.98] transition text-sm"
                title="Refresh"
                type="button"
                disabled={!startUrl}
              >
                Refresh
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-[#1c1c24] text-white hover:bg-[#2a2a36] active:scale-[.98] transition text-sm"
                title="Close"
                type="button"
              >
                Close
              </button>
            </div>
          </div>

          {/* Stage + iframe */}
          <div className="w-full min-h-[60vh] h-[calc(100%-3.5rem)] sm:h-[calc(100%-3rem)] p-3">
            <div className="w-full h-full rounded-xl bg-gradient-to-b from-[#a2c7fe] to-[#1a2540] border-2 border-[#c9afff] shadow-inner flex items-center justify-center">
              {startUrl ? (
                <iframe
                  key={buster}
                  srcDoc={srcDoc}
                  className="w-[96%] h-[96%] rounded-lg bg-white border border-[#111318] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.35),0_6px_18px_rgba(0,0,0,0.35)]"
                  title={`${headerTitle} • Interactive Demo`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
                />
              ) : (
                <div className="w-[96%] h-[96%] rounded-lg bg-white border border-[#111318] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.35),0_6px_18px_rgba(0,0,0,0.35)]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
