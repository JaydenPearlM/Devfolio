import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import AppProviders from "./provider/AppProviders.jsx";
import ErrorBoundary from "./component/ErrorBoundary.jsx";
import { initAnalyticsBeacons } from "./admin/beacons/beacons";
import "./styles/global.css";

initAnalyticsBeacons();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);