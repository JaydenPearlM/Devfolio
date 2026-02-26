// src/components/ResumeLinks.jsx
import React from "react";
import { recordResumeClick } from "../lib/analytics";
import resumePdf from "../assets/resume.pdf";
import resumePreview from "../assets/resume-preview.jpg";

export default function ResumeLinks() {
  function handleClick() {
    try {
      recordResumeClick({
        path: window.location.pathname,
        source: "resume_thumbnail",
        action: "open_resume",
        resume_url: resumePdf,
      });
    } catch {}

    // open actual resume
    window.open(resumePdf, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center py-4">
      <h3 className="text-medium md:text-base font-oswald font-bold text-blue-700 tracking-wide mb-3">
        My Resume
      </h3>

      <img
        src={resumePreview}
        alt="Resume preview"
        className="cursor-pointer rounded-2xl shadow hover:shadow-xl transition w-full max-w-md bg-white"
        onClick={handleClick}
      />
    </div>
  );
}
