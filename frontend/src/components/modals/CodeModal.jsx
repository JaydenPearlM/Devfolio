// devfolio-client/src/components/modals/CodeModal.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Displays uploaded code files (like .py, .js, .html, etc.) inside a modal.
 * Renders inside an iframe; text-based hint toggles monospace sizing.
 */
export default function CodeModal({ open, url, title, onClose }) {
  const isOpen = Boolean(open && url);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // mild hinting for text-ish files (doesn't affect iframe contents, just container styling if needed)
  const isTextBased = /\.(js|jsx|ts|tsx|py|capp|ipynb|json|html|css|txt|md)$/i.test(url);

  return createPortal(
    <div
      className="
        fixed inset-0
        z-[15000]
        bg-black/70
        backdrop-blur-sm
        flex items-center justify-center p-2 sm:p-4
      "
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          relative w-[95vw] max-w-5xl h-[85vh] sm:h-[88vh]
          bg-pink-50/95 border-2 border-pink-200 rounded-xl
          shadow-[0_0_35px_rgba(236,72,153,0.35)]
          overflow-hidden flex flex-col
          animate-[fadeIn_150ms_ease-out]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-5 py-2 sm:py-3 border-b border-pink-200 bg-pink-100/70">
          <h2 className="text-base sm:text-lg font-semibold text-pink-800 tracking-wide truncate">
            {title || "Code Preview"}
          </h2>
          <button
            onClick={onClose}
            className="text-pink-700 hover:text-pink-900 font-bold text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 bg-pink-50/90">
          <iframe
            src={url}
            title={title || "Code preview"}
            className="w-full h-full rounded-md bg-white border border-pink-200 shadow-inner"
            style={{
              fontSize: isTextBased ? "1.05rem" : "inherit",
              fontFamily: isTextBased ? "monospace" : "inherit",
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
