import React, { useEffect, useRef, useState } from "react";
import {
  recordProjectClick,
  recordProjectImpression,
} from "../lib/analytics";

function splitList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

function getProjectId(project) {
  const raw =
    project?.id ??
    project?._id ??
    project?.projectId ??
    project?.project_id ??
    null;
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  return value || null;
}

function getProjectPath() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function makeImpressionKey(projectId, path) {
  return `project_impression:${path}:${projectId}`;
}

function buildAnalyticsMeta(project) {
  return {
    title: project?.title || null,
    description: project?.description || null,
    skills: splitList(project?.skills),
    software: splitList(project?.software),
  };
}

export default function ProjectCard({ project }) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef(null);
  const hasTrackedImpressionRef = useRef(false);

  const projectId = getProjectId(project);

  const github =
    project?.github ||
    project?.github_url ||
    project?.github_link ||
    project?.githubLink ||
    "";

  const linkedin =
    project?.linkedin ||
    project?.linkedin_url ||
    project?.linkedin_link ||
    project?.linkedinLink ||
    "";

  const view =
    project?.projectIndexUrl ||
    project?.project_index_url ||
    project?.view ||
    project?.demo_url ||
    project?.live_url ||
    project?.web_app_url ||
    project?.websiteUrl ||
    "";

  const code =
    project?.code ||
    project?.code_url ||
    project?.code_file ||
    project?.codeFile ||
    "";

  const thumbnail =
    project?.thumbnail ||
    project?.thumbnail_url ||
    project?.thumb_url ||
    project?.thumbnailUrl ||
    "";

  const skills = splitList(project?.skills).slice(0, 5);
  const software = splitList(project?.software).slice(0, 5);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    const node = cardRef.current;
    if (!node) return;

    const path = getProjectPath();
    const impressionKey = makeImpressionKey(projectId, path);

    if (window.sessionStorage.getItem(impressionKey) === "1") {
      hasTrackedImpressionRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries?.[0];
        if (!entry?.isIntersecting) return;
        if (hasTrackedImpressionRef.current) return;

        hasTrackedImpressionRef.current = true;
        window.sessionStorage.setItem(impressionKey, "1");

        Promise.resolve(
          recordProjectImpression({
            projectId,
            project_id: projectId,
            path,
            source: "project-card",
            action: "project_impression",
            eventType: "project_impression",
            event_type: "project_impression",
            meta: buildAnalyticsMeta(project),
          })
        ).catch(() => {});

        observer.disconnect();
      },
      { threshold: 0.45 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [projectId, project]);

  function handleProjectClick(destination, href) {
    if (!projectId) return;
    Promise.resolve(
      recordProjectClick({
        projectId,
        project_id: projectId,
        path: getProjectPath(),
        source: "project-card",
        action: "project_click",
        eventType: "project_click",
        event_type: "project_click",
        destination,
        href,
        meta: { ...buildAnalyticsMeta(project), destination, href },
      })
    ).catch(() => {});
  }

  const ICONS = {
    GitHub: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:5,verticalAlign:"middle"}}>
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
    View: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5,verticalAlign:"middle"}}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    Code: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5,verticalAlign:"middle"}}>
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  };

  function TopLink({ href, label, colorClass, onClick }) {
    const icon = ICONS[label] || null;
    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`pcTopLink ${colorClass}`}
          onClick={onClick}
        >
          {icon}{label}
        </a>
      );
    }
    return (
      <span className="pcTopLink pcTopLink--disabled">
        {icon}{label}
      </span>
    );
  }

  return (
    <div className="pcWrap" ref={cardRef}>
      <div className={`pcCard ${flipped ? "pcCard--flipped" : ""}`}>

        {/* ── FRONT ── */}
        <div className="pcFace pcFront">
          {/* 3 inset green border rings */}
          <div className="pcRing pcRing--1" />
          <div className="pcRing pcRing--2" />
          <div className="pcRing pcRing--3" />

          {/* Title on top */}
          <h3 className="pcTitle">{project?.title}</h3>

          <div className="pcDivider" />

          {/* Thumbnail left, skills/software right */}
          <div className="pcBodyRow">
            <div className="pcThumbCol">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={`${project?.title || "Project"} thumbnail`}
                  className="pcThumb"
                />
              ) : (
                <div className="pcThumbPlaceholder" />
              )}
            </div>

            <div className="pcMetaCol">
              <div className="pcMeta">
                <span className="pcMetaLabel">Skills</span>
                <span className="pcMetaText">
                  {skills.length ? skills.join(", ") : "None listed"}
                </span>
              </div>

              <div className="pcMeta">
                <span className="pcMetaLabel">Software</span>
                <span className="pcMetaText">
                  {software.length ? software.join(", ") : "None listed"}
                </span>
              </div>
            </div>
          </div>

          <div className="pcDivider" />

          {/* Read More button */}
          <div className="pcReadMoreRow">
            <button
              className="pcReadMoreBtn"
              onClick={() => setFlipped(true)}
              type="button"
            >
              Click for Description ›
            </button>
          </div>

          <div className="pcDivider" />

          {/* GitHub / LinkedIn / View / Code below Read More */}
          <div className="pcLinks">
            <TopLink
              href={github}
              label="GitHub"
              colorClass="pcTopLink--github"
              onClick={() => handleProjectClick("github", github)}
            />
            <TopLink
              href={linkedin}
              label="LinkedIn"
              colorClass="pcTopLink--linkedin"
              onClick={() => handleProjectClick("linkedin", linkedin)}
            />
            <TopLink
              href={view}
              label="View"
              colorClass="pcTopLink--view"
              onClick={() => handleProjectClick("view", view)}
            />
            <TopLink
              href={code}
              label="Code"
              colorClass="pcTopLink--code"
              onClick={() => handleProjectClick("code", code)}
            />
          </div>
        </div>

        {/* ── BACK ── */}
        <div className="pcFace pcBack">
          {/* 3 inset green border rings */}
          <div className="pcRing pcRing--1" />
          <div className="pcRing pcRing--2" />
          <div className="pcRing pcRing--3" />

          <div className="pcBackInner">
            <h3 className="pcTitle pcTitle--back">{project?.title}</h3>
            <p className="pcBackSubtext">Project Description</p>

            <div className="pcDivider" />

            <div className="pcBackBody">
              <p className="pcDescription">
                {project?.description || "No description provided."}
              </p>
            </div>

            <div className="pcDivider" />

            {/* Back links */}
            <div className="pcLinks">
              <TopLink
                href={github}
                label="GitHub"
                colorClass="pcTopLink--github"
                onClick={() => handleProjectClick("github", github)}
              />
              <TopLink
                href={linkedin}
                label="LinkedIn"
                colorClass="pcTopLink--linkedin"
                onClick={() => handleProjectClick("linkedin", linkedin)}
              />
              <TopLink
                href={view}
                label="View"
                colorClass="pcTopLink--view"
                onClick={() => handleProjectClick("view", view)}
              />
              <TopLink
                href={code}
                label="Code"
                colorClass="pcTopLink--code"
                onClick={() => handleProjectClick("code", code)}
              />
            </div>

            <div className="pcDivider" />

            <div className="pcReadMoreRow">
              <button
                className="pcReadMoreBtn pcReadMoreBtn--back"
                onClick={() => setFlipped(false)}
                type="button"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
