import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Menu,
  X,
  Folder,
  BarChart3,
  LogOut,
  Linkedin,
  Github,
  BriefcaseBusiness,
  FileText,
} from "lucide-react";

import ResumeNavLink from "./ResumeNavLink";
import { useAdminAuth, signOut } from "../lib/auth.jsx";
import { recordLinkedInClick, recordGitHubClick } from "../lib/analytics";

import fallbackAvatar from "../Assets_Prod/old_files/jayden-avatar.jpg";
import dogSprite from "../Assets_Prod/old_files/dog-sprite.gif";
import fedSprite from "../Assets_Prod/old_files/dog-sprite-bone.gif";

const KO_FI_URL = "https://ko-fi.com/jaydendevfolio";
const PROFILE_AVATAR_KEY = "PROFILE_AVATAR_URL";
const FED_DOG_KEY = "devfolio_hasFedDog";
const FED_DOG_TTL_MS = 5 * 60 * 1000;
const MAX_AVATAR_SIZE_BYTES = 2.5 * 1024 * 1024;

const HUNGRY_LINES = [
  "Welcome! I'm the Dev Dog 🐶",
  "I'm guarding Jayden's projects.",
  "Hanging out in the sidebar, vibing.",
  "I keep an eye on the deploys.",
  "Here for emotional support and bug sniffing.",
];

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getStoredAvatar() {
  try {
    return localStorage.getItem(PROFILE_AVATAR_KEY) || fallbackAvatar;
  } catch {
    return fallbackAvatar;
  }
}

function getStoredFedState() {
  try {
    const stored = localStorage.getItem(FED_DOG_KEY);

    if (!stored) {
      return { hasFedDog: false, fedUntil: null };
    }

    const fedAt = Number(stored);

    if (!Number.isFinite(fedAt)) {
      localStorage.removeItem(FED_DOG_KEY);
      return { hasFedDog: false, fedUntil: null };
    }

    const fedUntil = fedAt + FED_DOG_TTL_MS;

    if (Date.now() >= fedUntil) {
      localStorage.removeItem(FED_DOG_KEY);
      return { hasFedDog: false, fedUntil: null };
    }

    return { hasFedDog: true, fedUntil };
  } catch {
    return { hasFedDog: false, fedUntil: null };
  }
}

export default function Sidebar({ isOpen, onOpen, onClose }) {
  const location = useLocation();
  const fileRef = useRef(null);

  const { loading: authLoading, session, isAdmin } = useAdminAuth();

  const authed = Boolean(session) && Boolean(isAdmin);
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [avatarUrl, setAvatarUrl] = useState(getStoredAvatar);
  const [dogLine, setDogLine] = useState(() => pickRandom(HUNGRY_LINES));
  const [fedState, setFedState] = useState(getStoredFedState);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDogLine(pickRandom(HUNGRY_LINES));
    }, 25000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!fedState.hasFedDog || !fedState.fedUntil) {
      return;
    }

    const remainingMs = fedState.fedUntil - Date.now();

    if (remainingMs <= 0) {
      setFedState({ hasFedDog: false, fedUntil: null });

      try {
        localStorage.removeItem(FED_DOG_KEY);
      } catch {
        // ignore storage issues
      }

      return;
    }

    const timeoutId = setTimeout(() => {
      setFedState({ hasFedDog: false, fedUntil: null });

      try {
        localStorage.removeItem(FED_DOG_KEY);
      } catch {
        // ignore storage issues
      }
    }, remainingMs);

    return () => clearTimeout(timeoutId);
  }, [fedState]);

  function onPickFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      alert("Image must be under ~2.5MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const dataUrl = reader.result;
        localStorage.setItem(PROFILE_AVATAR_KEY, dataUrl);
        setAvatarUrl(dataUrl);
      } catch {
        alert("Couldn't save image");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsDataURL(file);
  }

  async function handleLogout() {
    await signOut();
    window.location.replace("/");
  }

  function handleSupportClick() {
    try {
      window.open(KO_FI_URL, "_blank", "noopener,noreferrer");
    } catch {
      // ignore popup issues
    }

    const fedAt = Date.now();
    const fedUntil = fedAt + FED_DOG_TTL_MS;

    setFedState({ hasFedDog: true, fedUntil });

    try {
      localStorage.setItem(FED_DOG_KEY, String(fedAt));
    } catch {
      // ignore storage issues
    }
  }

  function handleSidebarLinkedInClick() {
    recordLinkedInClick({
      source: "sidebar",
      action: "external_link",
      label: "linkedin_sidebar",
      location: isAdminRoute ? "admin_sidebar" : "public_sidebar",
    });
  }

  function handleSidebarGitHubClick() {
    recordGitHubClick({
      source: "sidebar",
      action: "external_link",
      label: "github_sidebar",
      location: isAdminRoute ? "admin_sidebar" : "public_sidebar",
    });
  }

  const baseLinkClass =
    "flex items-center w-full rounded-lg px-3 py-2 mb-2 transition-colors select-none text-blue-950";

  const hoverLinkClass =
    "hover:bg-white/40 hover:text-blue-900 border border-transparent hover:border-white/50";

  function navLinkClass({ isActive }) {
    return `${baseLinkClass} ${
      isActive ? "bg-white/60 shadow-inner" : "bg-white/20"
    } ${hoverLinkClass}`;
  }

  function publicLinkClass() {
    return `${baseLinkClass} bg-white/20 ${hoverLinkClass}`;
  }

  const currentDogSprite = fedState.hasFedDog ? fedSprite : dogSprite;

  return (
    <>
      <button
        type="button"
        onClick={isOpen ? onClose : onOpen}
        className="md:hidden fixed top-3 left-3 z-[9000] bg-white/90 p-1.5 rounded-lg shadow border border-blue-200"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <X className="w-4 h-4 text-gray-700" />
        ) : (
          <Menu className="w-4 h-4 text-gray-700" />
        )}
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[9990] bg-black/40"
          onClick={onClose}
        />
      )}

      <aside className="w-0 md:w-64 relative h-full">
        <div
          className={`
            fixed
            top-0
            left-0
            w-[82vw] max-w-sm md:w-64
            min-h-screen md:h-full
            p-6
            dp-sidebarShell
            transition-transform duration-300 ease-in-out
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            z-[10000]
            rounded-2xl shadow-[4px_0_15px_rgba(0,0,0,0.15)]
            before:content-[''] before:absolute before:inset-[6px] before:rounded-xl
            before:pointer-events-none before:border before:border-white/70
            before:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]
            flex flex-col
          `}
        >
          <button
            type="button"
            onClick={onClose}
            className="md:hidden absolute top-3 right-2 text-blue-900 hover:text-blue-950"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-bold text-center text-white/95 px-4 py-3 rounded-md bg-blue-500/90 mb-4 shadow-sm">
              {isAdminRoute ? "Admin" : "Welcome!"}
            </h2>

            <div className="mb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="Jayden avatar"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div className="min-w-0 text-center">
                  <div className="font-semibold text-blue-900">
                    Jayden Maxwell
                  </div>
                  <div className="text-xs text-blue-900/70">
                    Full-Stack Engineer
                  </div>

                  {authed && (
                    <>
                      <button
                        type="button"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => fileRef.current?.click()}
                        disabled={authLoading}
                      >
                        Change
                      </button>

                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPickFile}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex flex-col">
              <NavLink to="/" className={publicLinkClass} end>
                <Home className="w-5 h-5 mr-2" />
                Homepage
              </NavLink>

              <NavLink to="/pricing" className={publicLinkClass}>
                <BriefcaseBusiness className="w-5 h-5 mr-2" />
                Hire Me / Services
              </NavLink>

              {!authed && (
                <>
                  <a
                    href="https://www.linkedin.com/in/jaydenmaxwell/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={publicLinkClass()}
                    onClick={handleSidebarLinkedInClick}
                  >
                    <Linkedin className="w-5 h-5 mr-2" />
                    LinkedIn
                  </a>

                  <a
                    href="https://github.com/JaydenPearlM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={publicLinkClass()}
                    onClick={handleSidebarGitHubClick}
                  >
                    <Github className="w-5 h-5 mr-2" />
                    GitHub
                  </a>

                  <ResumeNavLink className={publicLinkClass()}>
                    <FileText className="w-5 h-5 mr-2" />
                    Resume
                  </ResumeNavLink>
                </>
              )}

              {authed && (
                <>
                  <NavLink to="/admin" end className={navLinkClass}>
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Analytics
                  </NavLink>

                  <NavLink to="/admin/projects" className={navLinkClass}>
                    <Folder className="w-5 h-5 mr-2" />
                    Manage Projects
                  </NavLink>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 mb-2 rounded text-red-600 hover:bg-red-50 transition-colors"
                    disabled={authLoading}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </button>
                </>
              )}
            </nav>

            <div className="mt-4 mb-6 p-2 rounded-xl dp-transSurface border border-white/70 shadow text-blue-950 text-center">
              <div className="text-sm font-bold text-blue-900 mb-1 uppercase tracking-wide">
                Dev Dog Tip Jar
              </div>

              <div className="relative flex items-center justify-center mb-1">
                <img
                  src={currentDogSprite}
                  alt="Dev dog"
                  className="w-28 h-28 object-contain drop-shadow-lg"
                />
              </div>

              <div className="text-base leading-snug mb-2 px-2 py-1 rounded-lg bg-white/85 border border-white/80 shadow-inner">
                {dogLine}
              </div>

              <button
                type="button"
                onClick={handleSupportClick}
                className="inline-flex items-center justify-center px-4 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-orange-400 to-pink-500 shadow hover:brightness-110 mb-1"
              >
                {fedState.hasFedDog
                  ? "Thank you for the bone! 🦴"
                  : "Give the Dog a Bone!"}
              </button>

              <div className="mt-1 text-[10px] leading-tight text-blue-900/80">
                <div>
                  Dog sprite created by{" "}
                  <span className="font-semibold">Zachary Ravish</span>.
                </div>
                <div>All donations help keep the site hosted and online.</div>
              </div>
            </div>

            <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 border border-white/60 shadow text-blue-950 text-center">
              <h3 className="font-semibold text-blue-900 mb-3">
                ⚡ Currently Building & Learning
              </h3>

              <ul className="space-y-1 text-sm text-purple-700 leading-relaxed font-medium">
                <li>DeltaPets browser Game</li>
                <li>Mental Health App</li>
                <li>Debug App</li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}