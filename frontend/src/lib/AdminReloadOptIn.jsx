// src/components/AdminReloadOptIn.jsx
import React from "react";

export default function AdminReloadOptIn({ label = "Reload admin (stay here)" }) {
  return (
    <button
      className="text-xs underline opacity-80 hover:opacity-100"
      onClick={() => {
        sessionStorage.setItem("__allowAdminReload", "1");
        window.location.reload();
      }}
      title="Hard reload this admin view once without redirecting to Home"
    >
      {label}
    </button>
  );
}
