import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { recordPageview, recordLoadTime } from "../lib/analytics";

import { useIsMobile } from "../hooks/useIsMobile";
import HomeDesktopLayout from "./layout/HomeDesktopLayout";
import HomeMobileLayout from "./layout/HomeMobileLayout";
import { normalizeProjectRows } from "./projectTransforms";

const PROJECT_SELECT_FIELDS = [
  "id",
  "title",
  "description",
  "skills",
  "github_link",
  "web_app_url",
  "thumbnail",
  "project_files",
  "project_index_url",
  "code_file",
  "tags",
  "time",
].join(",");

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");


  const isMobile = useIsMobile();

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.log("isMobile:", isMobile);
  }, [isMobile]);

  useEffect(() => {
    try {
      const startedAt = performance.now();

      recordPageview("/");

      const scheduleMeasure =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame
          : (callback) => setTimeout(callback, 0);

      scheduleMeasure(() => {
        const loadTimeMs = Math.round(performance.now() - startedAt);
        recordLoadTime("/", loadTimeMs);
      });
    } catch {
      // analytics should never crash homepage render
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadProjects() {
      try {
        const { data, error: fetchError } = await supabase
          .from("Devfolio")
          .select(PROJECT_SELECT_FIELDS)
          .order("time", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (isCancelled) {
          return;
        }

        setProjects(normalizeProjectRows(data || []));
        setError("");
      } catch (err) {
        console.error("Error loading projects:", err);

        if (isCancelled) {
          return;
        }

        setProjects([]);
        setError("Failed to load projects.");
      }
    }

    loadProjects();

    return () => {
      isCancelled = true;
    };
  }, []);

return (
  <>
    {isMobile ? (
      <HomeMobileLayout
        projects={projects}
      />
    ) : (
      <HomeDesktopLayout
        projects={projects}
        error={error}      
      />
    )}
  </>
);
}