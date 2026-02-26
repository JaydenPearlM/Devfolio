import React from "react";
import { config } from "../lib/config";

export default function TopBanner() {
  const year = new Date().getFullYear();
  const versionText = config.appVersion ? `v${config.appVersion}` : "";

  return (
    <div className="w-full border-b border-white/10 bg-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="font-bold tracking-tight">{config.siteName}</div>
          {versionText ? <span className="text-xs opacity-70">{versionText}</span> : null}
        </div>

        <div className="flex items-center gap-3 text-sm opacity-90">
          {config.githubUrl ? (
            <a className="hover:underline" href={config.githubUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
          ) : null}
          {config.linkedinUrl ? (
            <a className="hover:underline" href={config.linkedinUrl} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          ) : null}
          {config.kofiUrl ? (
            <a className="hover:underline" href={config.kofiUrl} target="_blank" rel="noreferrer">
              Ko-fi
            </a>
          ) : null}
          <span className="text-xs opacity-60">© {year}</span>
        </div>
      </div>
    </div>
  );
}