import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ProjectInfoPopover({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="
        fixed inset-0
        z-[11000]
        bg-black/60
        backdrop-blur-sm
        flex items-center justify-center p-4
        animate-[fadeIn_140ms_ease-out]
      "
      style={{ zIndex: 15000 }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="
          relative w-[95vw] max-w-2xl
          rounded-2xl overflow-hidden
          shadow-[0_30px_80px_rgba(0,0,0,0.45)]
          dp-transSurface
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative m-[6px] rounded-xl bg-white/80 backdrop-blur-sm border border-white/60">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/60 bg-white/60 rounded-t-xl">
            <h3 className="text-2xl font-bold text-blue-900 tracking-tight">
              How to Use The Cards
            </h3>

            <button
              onClick={onClose}
              className="text-blue-900 hover:text-blue-950 font-bold text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="p-6 text-blue-950/90 text-base md:text-lg leading-relaxed">
            <ol className="list-decimal ml-6 space-y-3">
              <li>
                Click <span className="font-semibold">View</span> to see a full
                deployment of the project.
              </li>
              <li>
                Click <span className="font-semibold">Github</span> to see the
                full repo of the project.
              </li>
              <li>
                Click <span className="font-semibold">Code</span> to view the
                code of the project.
              </li>
              <li>
                Hover over <span className="font-semibold">Description</span> to
                read the full description.
              </li>
              <li>
                Use the search bar to <span className="font-semibold">search</span>{" "}
                for skills or tags.
              </li>
              <li>
                Use <span className="font-semibold">Esc</span> or click outside
                the card to close it.
              </li>
            </ol>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="
                w-full mt-3 rounded-lg
                bg-blue-600 text-white text-lg
                px-5 py-2.5 font-semibold
                shadow hover:bg-blue-700 active:scale-[.99] transition
              "
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}