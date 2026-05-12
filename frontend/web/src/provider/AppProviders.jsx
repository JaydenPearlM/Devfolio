import React from "react";

/**
 * Put NON-router providers here.
 * Examples: AuthProvider, QueryClientProvider, ThemeProvider, etc.
 *
 * IMPORTANT:
 * Do NOT put <BrowserRouter> in here.
 * Router belongs in src/main.jsx only.
 */
export default function AppProviders({ children }) {
  return <>{children}</>;
}