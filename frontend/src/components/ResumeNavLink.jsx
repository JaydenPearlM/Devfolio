// src/components/ResumeNavLink.jsx
import React from "react";
import resumePdf from "../assets/resume.pdf";
import { recordResumeClick } from "../lib/analytics";

/**
 * Sidebar resume link.
 * We explicitly fire resume-click analytics on click.
 */
export default function ResumeNavLink({ className = "", children = "Résumé" }) {
  function handleClick() {
    try {
      recordResumeClick({
        path: window.location.pathname,
        resume_url: resumePdf,
        source: "sidebar",
        action: "click",
      });
    } catch {
      // don't break navigation if analytics fails
    }
  }

  return (
    <a
      href={resumePdf}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      data-testid="sidebar-resume-link"
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
