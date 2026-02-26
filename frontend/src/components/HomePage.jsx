// devfolio-client/src/components/HomePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { recordPageview, recordLoadTime } from "../lib/analytics";
import ProjectInfoPopover from "./ProjectInfoPopover";
import smoke from "../assets/smoke.jpg";      // bundled image
import "../pages/homePage.css";               // CSS with ::before smoke

// NEW: responsive hook + layout components
import useIsMobile from "../hooks/useIsMobile";
import HomeDesktopLayout from "./layout/HomeDesktopLayout";
import HomeMobileLayout from "./layout/HomeMobileLayout";

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const navigate = useNavigate();
  const isMobile = useIsMobile();

  console.log("isMobile?", isMobile);


  // ───────────────────────────────────────────────
  // Analytics beacons
  useEffect(() => {
    try {
      const t0 = performance.now();
      recordPageview("/");

      const raf =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame
          : (cb) => setTimeout(cb, 0);

      raf(() => {
        const ms = Math.round(performance.now() - t0);
        recordLoadTime("/", ms);
      });

      fetch("/api/analytics/public?range=7")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad resp"))))
        .then(setSummary)
        .catch(() => {});
    } catch {}
  }, []);
  // ───────────────────────────────────────────────

  // Load projects from Supabase
  async function loadProjects() {
    const toUrlArray = (v) => {
      if (Array.isArray(v)) return v.map(String).filter(Boolean);
      if (v == null) return [];
      const s = String(v).trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {}
      return s
        .split(",")
        .map((x) => x.trim().replace(/^(\[)?"+|"+(\])?$/g, ""))
        .filter(Boolean);
    };

    try {
      const { data, error } = await supabase
        .from("Devfolio")
        .select(
          [
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
          ].join(",")
        )
        .order("time", { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((r) => {
        const tagsArray = Array.isArray(r.tags)
          ? r.tags
          : String(r.tags || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

        const projectFiles = toUrlArray(r.project_files);

        return {
          id: r.id,
          title: r.title,
          description: r.description,
          skills: r.skills,
          github_link: r.github_link,
          web_app_url: r.web_app_url,
          thumbnail: r.thumbnail,
          project_files: projectFiles,
          project_index_url: r.project_index_url,
          code_file: r.code_file,
          tags: r.tags,
          time: r.time,

          githubLink: r.github_link,
          websiteUrl: r.web_app_url,
          projectFiles,
          projectIndexUrl: r.project_index_url,
          codeFile: r.code_file,
          created_at: r.time,
          tagsArray,
        };
      });

      setProjects(normalized);
    } catch (err) {
      console.error("Error loading projects:", err);
      setError("Failed to load projects.");
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div
      className="homePage home-smoke w-full min-h-screen"
      style={{ "--smoke-image": `url(${smoke})` }} // passes URL to CSS ::before
    >
      {/* Page canvas: constrain desktop width */}
     <div
  className="w-full px-0 sm:px-4 md:px-4 mt-4 md:mt-6"
>

        {isMobile ? (
          <HomeMobileLayout
            projects={projects}
            error={error}
            setInfoOpen={setInfoOpen}
            navigate={navigate}
          />
        ) : (
          <HomeDesktopLayout
            projects={projects}
            error={error}
            setInfoOpen={setInfoOpen}
            navigate={navigate}
          />
        )}
      </div>

      <ProjectInfoPopover open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
