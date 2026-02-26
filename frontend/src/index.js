// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Analytics bootstrap (single init)
import { initAnalyticsBeacons } from "./analytics/beacons";

// Initialize analytics once at app startup
initAnalyticsBeacons();

// Mount the React app
const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(<App />);