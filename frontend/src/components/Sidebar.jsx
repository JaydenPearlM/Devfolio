// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import ResumeNavLink from "./ResumeNavLink";
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
import { isAuthed, clearAdminToken } from "../lib/auth";
import fallbackAvatar from "../assets/jayden-avatar.jpg";
import dogSprite from "../assets/dog-sprite.gif";
import fedSprite from "../assets/dog-sprite-bone.gif";

/* -------------------- Dev Dog Constants -------------------- */

const KO_FI_URL = "https://ko-fi.com/jaydendevfolio";
const FED_DOG_KEY = "devfolio_hasFedDog"; // key in localStorage
const FED_DOG_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Lines BEFORE any real donation integration
const HUNGRY_LINES = [
  "Welcome! I'm the Dev Dog 🐶",
  "I'm guarding Jayden's projects.",
  "Hanging out in the sidebar, vibing.",
  "I keep an eye on the deploys.",
  "Here for emotional support and bug sniffing.",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ------------------------------------------------------------ */

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [authed, setAuthed] = useState(isAuthed());
  const isAdminRoute = location.pathname.startsWith("/admin");

  /* -------------------- Avatar Logic -------------------- */
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      return localStorage.getItem("PROFILE_AVATAR_URL") || fallbackAvatar;
    } catch {
      return fallbackAvatar;
    }
  });

  const fileRef = useRef(null);

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2.5 * 1024 * 1024) {
      alert("Image must be under ~2.5MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dataUrl = reader.result;
        localStorage.setItem("PROFILE_AVATAR_URL", dataUrl);
        setAvatarUrl(dataUrl);
      } catch {
        alert("Couldn't save image");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsDataURL(f);
  }

  useEffect(() => {
    const updateAuth = () => setAuthed(isAuthed());
    window.addEventListener("authChange", updateAuth);
    window.addEventListener("storage", updateAuth);
    updateAuth();
    return () => {
      window.removeEventListener("authChange", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    clearAdminToken();
    setAuthed(false);
    try {
      window.dispatchEvent(new Event("authChange"));
    } catch {}
    window.location.replace("/");
  };

  /* -------------------- Dev Dog State -------------------- */

  const [dogLine, setDogLine] = useState("Welcome! I'm the Dev Dog 🐶");
  const [hasFedDog, setHasFedDog] = useState(false);
  const [fedUntil, setFedUntil] = useState(null); // timestamp (ms) when bone expires

  // Load "fed" state on mount (with 5-minute TTL)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FED_DOG_KEY);
      if (!stored) return;

      const fedAt = Number(stored);
      if (!Number.isFinite(fedAt)) {
        // old bad value like "true" — clean it up
        localStorage.removeItem(FED_DOG_KEY);
        return;
      }

      const expiresAt = fedAt + FED_DOG_TTL_MS;
      const now = Date.now();

      if (now < expiresAt) {
        setHasFedDog(true);
        setFedUntil(expiresAt);
      } else {
        // expired, clear it
        localStorage.removeItem(FED_DOG_KEY);
      }
    } catch {
      // ignore if localStorage not available
    }
  }, []);

  // Rotate dog lines
  useEffect(() => {
    setDogLine(pickRandom(HUNGRY_LINES));

    const id = setInterval(() => {
      setDogLine(pickRandom(HUNGRY_LINES));
    }, 25000);

    return () => clearInterval(id);
  }, []);

  // Auto-reset dog after TTL passes (while page is open)
  useEffect(() => {
    if (!hasFedDog || !fedUntil) return;

    const now = Date.now();
    const remaining = fedUntil - now;

    if (remaining <= 0) {
      setHasFedDog(false);
      try {
        localStorage.removeItem(FED_DOG_KEY);
      } catch {}
      return;
    }

    const id = setTimeout(() => {
      setHasFedDog(false);
      try {
        localStorage.removeItem(FED_DOG_KEY);
      } catch {}
    }, remaining);

    return () => clearTimeout(id);
  }, [hasFedDog, fedUntil]);

  // Main support handler (button only)
  const handleSupportClick = () => {
    // Open Ko-fi
    try {
      window.open(KO_FI_URL, "_blank", "noopener,noreferrer");
    } catch {
      // ignore popup block
    }

    // Mark dog as fed for 5 minutes
    const now = Date.now();
    const expiresAt = now + FED_DOG_TTL_MS;

    setHasFedDog(true);
    setFedUntil(expiresAt);

    try {
      // store the time we fed him
      localStorage.setItem(FED_DOG_KEY, String(now));
    } catch {
      // ignore
    }
  };

  /* -------------------- Scroll Lock for mobile drawer -------------------- */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* -------------------- Sidebar UI -------------------- */

  const baseLink =
    "flex items-center w-full rounded-lg px-3 py-2 mb-2 transition-colors select-none text-blue-950";
  const hoverLink =
    "hover:bg-white/40 hover:text-blue-900 border border-transparent hover:border-white/50";
  const linkClass = ({ isActive }) =>
    `${baseLink} ${isActive ? "bg-white/60 shadow-inner" : "bg-white/20"} ${hoverLink}`;
  const homepageClass = () => `${baseLink} bg-white/20 ${hoverLink}`;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onClose}
        className="md:hidden fixed top-3 left-3 z-[9000] bg-white/90 p-1.5 rounded-lg shadow border border-blue-200"
      >
        <Menu className="w-4 h-4 text-gray-700" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[9990] bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside className="w-0 md:w-64 relative h-full">
        <div
          className={`
            fixed
            top-0
            left-0
            w-[82vw] max-w-sm md:w-64
            min-h-screen md:h-full
            p-6
            bg-gradient-to-br from-purple-200 via-blue-300 to-pink-200
            border-4 border-blue-300
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
          {/* Close button */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-3 right-2 text-blue-900 hover:text-blue-950"
          >
            <X className="w-4 h-4" />
          </button>

          {/* MAIN CONTENT (fills available height) */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <h2 className="text-2xl font-bold text-center text-white/95 px-4 py-3 rounded-md bg-blue-500/90 mb-4 shadow-sm">
              {isAdminRoute ? "Admin" : "Welcome!"}
            </h2>

            {/* Avatar */}
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
                        className="mt-1 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => fileRef.current?.click()}
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

            {/* Nav Links */}
            <nav className="flex flex-col">
              <NavLink to="/" className={homepageClass} end>
                <Home className="w-5 h-5 mr-2" /> Homepage
              </NavLink>

              {/* Hire Me / Services button */}
              <NavLink to="/pricing" className={homepageClass}>
                <BriefcaseBusiness className="w-5 h-5 mr-2" /> Hire Me / Services
              </NavLink>

              {!authed && (
                <>
                  <a
                    href="https://www.linkedin.com/in/jaydenmaxwell/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={homepageClass()}
                  >
                    <Linkedin className="w-5 h-5 mr-2" /> LinkedIn
                  </a>
                  <a
                    href="https://github.com/JaydenPearlM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={homepageClass()}
                  >
                    <Github className="w-5 h-5 mr-2" /> GitHub
                  </a>

                  <ResumeNavLink className={homepageClass()}>
                    <FileText className="w-5 h-5 mr-2" /> Resume
                  </ResumeNavLink>
                </>
              )}

              {authed && (
                <>
                  <NavLink to="/admin" end className={linkClass}>
                    <BarChart3 className="w-5 h-5 mr-2" /> Analytics
                  </NavLink>

                  <NavLink to="/admin/projects" className={linkClass}>
                    <Folder className="w-5 h-5 mr-2" /> Manage Projects
                  </NavLink>

                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 mb-2 rounded text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-2" /> Logout
                  </button>
                </>
              )}
            </nav>

            {/* -------------------- DEV DOG SECTION -------------------- */}
            <div className="mt-4 mb-6 p-2 rounded-xl bg-gradient-to-br from-purple-200 via-blue-200 to-pink-200 border border-white/70 shadow text-blue-950 text-center">
              <div className="text-sm font-bold text-blue-900 mb-1 uppercase tracking-wide">
                Dev Dog Tip Jar
              </div>

              <div className="relative flex items-center justify-center mb-1">
                <img
                  src={hasFedDog ? fedSprite : dogSprite}
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
                {hasFedDog ? "Thank you for the bone! 🦴" : "Give the Dog a Bone!"}
              </button>

              <div className="mt-1 text-[10px] leading-tight text-blue-900/80">
                <div>
                  Dog sprite created by{" "}
                  <span className="font-semibold">Zachary Ravish</span>.
                </div>
                <div>All donations help keep the site hosted and online.</div>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 border border-white/60 shadow text-blue-950 text-center">
              <h3 className="font-semibold text-blue-900 mb-3">
                ⚡ Currently Building & Learning
              </h3>

              <ul className="space-y-1 text-sm text-purple-700 leading-relaxed font-medium">
                <li>Typescript</li>
                <li>Mental Health App</li>
                <li>Browser Game</li>
                <li>Debug App</li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
