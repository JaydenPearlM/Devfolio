// src/components/AddProjectForm.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createSupaProject, updateProjectById } from "../lib/supaProjects";
import { supabase } from "../lib/supabaseClient";
import JSZip from "jszip";

const initialState = {
  title: "",
  description: "",
  skills: "",
  githubLink: "",
  websiteUrl: "",
  tags: "",
  time: "",
  existingThumbUrl: "",
  // DB column remains lower_snake:
  existing_project_files: [],
  existingCodeFileName: "",
  // demo_entry removed by request
};

/** Extract a readable filename from a URL or a path */
function fileNameFromPathOrUrl(str = "") {
  try {
    const noQuery = String(str).split("?")[0];
    const last = noQuery.split("/").pop() || "";
    return decodeURIComponent(last) || String(str);
  } catch {
    return String(str);
  }
}

/** ─────────────────────────────────────────────────────────────
 *  Helpers: MIME by name + slugify
 *  ──────────────────────────────────────────────────────────── */
function mimeFromName(name = "") {
  const ext = name.toLowerCase().split(".").pop() || "";
  switch (ext) {
    case "html":
    case "htm":
      return "text/html; charset=utf-8";
    case "css":
      return "text/css; charset=utf-8";
    case "js":
      return "application/javascript; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "ico":
      return "image/x-icon";
    case "txt":
      return "text/plain; charset=utf-8";
    case "woff":
      return "font/woff";
    case "woff2":
      return "font/woff2";
    case "ttf":
      return "font/ttf";
    case "otf":
      return "font/otf";
    case "mp3":
      return "audio/mpeg";
    case "mp4":
      return "video/mp4";
    case "pdf":
      return "application/pdf";
    case "wasm":
      return "application/wasm";
    case "zip":
      return "application/zip";

    // ➕ Added for code + notebooks
    case "py":
      return "text/x-python; charset=utf-8";
    case "ipynb":
      return "application/x-ipynb+json; charset=utf-8";
    case "md":
      return "text/markdown; charset=utf-8";
    case "jsx":
      return "text/jsx; charset=utf-8";
    case "tsx":
      return "text/tsx; charset=utf-8";
    case "ts":
      return "application/typescript; charset=utf-8";
    case "capp":
      return "application/octet-stream";

    default:
      return "application/octet-stream";
  }
}

// Clean project title into a slug for folder prefix
function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Turn "react, supabase" OR ["react","supabase"] into ["react","supabase"] or null */
function toTagsArray(input) {
  if (Array.isArray(input)) {
    const arr = input.map(String).map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : null;
  }
  const s = String(input || "").trim();
  if (!s) return null;
  const arr = s.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
  return arr.length ? arr : null;
}

/** Presentational block to summarize stored files while editing */
function StoredFilesSummary({ formData }) {
  const thumbName = formData.existingThumbUrl
    ? fileNameFromPathOrUrl(formData.existingThumbUrl)
    : "—";

  const projFiles = Array.isArray(formData.existing_project_files)
    ? formData.existing_project_files
        .map((f) =>
          typeof f === "string"
            ? fileNameFromPathOrUrl(f)
            : f?.name || fileNameFromPathOrUrl(f?.url || "")
        )
        .filter(Boolean)
    : [];

  const projFilesLine = projFiles.length > 0 ? projFiles.join(", ") : "—";
  const codeFileName = (formData.existingCodeFileName || "").trim() || "—";

  return (
    <div
      className="mb-4 rounded p-3 bg-white"
      style={{
        border: "2px solid #b3d8ff",
        boxShadow: "0 8px 24px rgba(150, 90, 255, 0.18)",
      }}
    >
      <div className="text-sm font-semibold mb-2">Stored Files</div>
      <div className="text-xs space-y-2">
        <div>
          <span className="text-gray-600">Thumbnail:</span>{" "}
          <span className="font-medium break-all">{thumbName}</span>
        </div>
        <div>
          <span className="text-gray-600">Project Files:</span>{" "}
          <span className="font-medium break-words">{projFilesLine}</span>
        </div>
        <div>
          <span className="text-gray-600">Code File:</span>{" "}
          <span className="font-medium break-all">{codeFileName}</span>
        </div>
      </div>
    </div>
  );
}

/** Upload a ZIP as a static site */
async function uploadZipAsStaticSite({ zipFile, projectTitle }) {
  const zip = await JSZip.loadAsync(zipFile);
  const entries = Object.keys(zip.files);

  const indexCandidates = entries.filter(
    (p) =>
      p.toLowerCase() === "index.html" || p.toLowerCase().endsWith("/index.html")
  );
  if (indexCandidates.length === 0) {
    throw new Error(
      "Your zip has no index.html. Put an index.html at root or inside the top folder."
    );
  }
  indexCandidates.sort((a, b) => a.length - b.length);
  const indexPathInZip = indexCandidates[0];

  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const basePrefix = `${slugify(projectTitle) || "project"}-${stamp}`;

  const uploadedUrls = [];
  for (const path of entries) {
    const item = zip.files[path];
    if (item.dir) continue;

    const blob = await item.async("blob");
    const cleanPath = path.replace(/^[.\/]+/, "");
    const storagePath = `${basePrefix}/${cleanPath}`;

    const contentType = mimeFromName(path);
    const { error } = await supabase.storage
      .from("projectFiles")
      .upload(storagePath, blob, {
        contentType,
        upsert: true,
        cacheControl: "public, max-age=31536000, immutable",
      });

    if (error) {
      console.error("Upload failed:", storagePath, error);
      throw error;
    }

    const { data: pub } = supabase.storage
      .from("projectFiles")
      .getPublicUrl(storagePath);
    uploadedUrls.push(pub.publicUrl);
  }

  const indexStoragePath = `${basePrefix}/${indexPathInZip.replace(/^[.\/]+/, "")}`;
  const { data: indexPub } = supabase
    .storage
    .from("projectFiles")
    .getPublicUrl(indexStoragePath);

  return {
    siteIndexUrl: indexPub.publicUrl,
    allFileUrls: uploadedUrls,
  };
}

/** Upload an array of Files (folder selection) as a static site */
async function uploadProjectFilesToStorage(files, projectTitle) {
  if (!files || files.length === 0) {
    return { project_index_url: null, urls: [] };
  }

  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const basePrefix = `${slugify(projectTitle) || "project"}-${stamp}`;

  const paths = [];
  const urls = [];

  for (const f of files) {
    const rel = (f.webkitRelativePath || f.name || "").replace(/^[.\/]+/, "");
    const storagePath = `${basePrefix}/${rel}`;
    const contentType =
      (f.type && f.type !== "application/octet-stream" ? f.type : mimeFromName(rel));

    const { error } = await supabase.storage
      .from("projectFiles")
      .upload(storagePath, f, {
        contentType,
        upsert: true,
        cacheControl: "public, max-age=31536000, immutable",
      });

    if (error) {
      console.error("Upload failed:", storagePath, error);
      throw new Error(`Upload failed: ${rel}`);
    }

    const { data: pub } = supabase.storage
      .from("projectFiles")
      .getPublicUrl(storagePath);

    urls.push(pub.publicUrl);
    paths.push(storagePath);
  }

  const indexCandidates = paths.filter((p) => /(^|\/)index\.html$/i.test(p));
  indexCandidates.sort((a, b) => a.length - b.length);
  const indexPath = indexCandidates[0] || null;

  const project_index_url = indexPath
    ? supabase.storage.from("projectFiles").getPublicUrl(indexPath).data.publicUrl
    : null;

  return { project_index_url, urls, basePrefix };
}

export default function AddProjectForm({
  formData,
  setFormData,
  isEditing = false,
  editingId = null,
  onSave,
  onCancelEdit,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const thumbRef = useRef(null);
  const projRef = useRef(null);
  const codeRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);

  const [pickedProjectFiles, setPickedProjectFiles] = useState([]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [isEditing]);

  const submitLabel = useMemo(
    () =>
      submitting
        ? isEditing
          ? "Saving changes…"
          : "Submitting…"
        : isEditing
        ? "Save Changes"
        : "Submit Project",
    [submitting, isEditing]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "websiteUrl") {
      const v = value;
      setFormData((s) => ({ ...s, websiteUrl: v }));
      if (v.trim()) {
        if (projRef.current) projRef.current.value = "";
        setPickedProjectFiles([]);
      }
      return;
    }

    setFormData((s) => ({ ...s, [name]: value }));
  };

  const clearAllFiles = () => {
    if (thumbRef.current) thumbRef.current.value = "";
    if (projRef.current) projRef.current.value = "";
    if (codeRef.current) codeRef.current.value = "";
    setPickedProjectFiles([]);
  };

  const clearAllText = () => {
    setFormData({ ...initialState });
  };

  const clearEverything = () => {
    clearAllText();
    clearAllFiles();
    if (formRef.current?.reset) formRef.current.reset();
    titleRef.current?.focus();
  };

  useEffect(() => {
    const allCleared = Object.keys(initialState).every(
      (k) => String(formData?.[k] ?? "").trim() === ""
    );
    if (allCleared) clearAllFiles();
  }, [formData]);

  const handleProjectFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 1 && /\.zip$/i.test(files[0]?.name || "")) {
      setPickedProjectFiles(files);
      setFormData((s) => ({ ...s, websiteUrl: "" }));
      return;
    }

    setPickedProjectFiles(files);

    if (files.length > 0) {
      setFormData((s) => ({ ...s, websiteUrl: "" }));
    }
  };

  const makePayload = () => {
    const allFiles =
      pickedProjectFiles.length > 0
        ? pickedProjectFiles
        : projRef.current?.files
        ? Array.from(projRef.current.files)
        : [];

    const hasWebsite = (formData.websiteUrl || "").trim().length > 0;

    const project_files_paths = hasWebsite
      ? []
      : allFiles.map((f) => f.webkitRelativePath || f.name);

    const payload = {
      title: (formData.title || "").trim(),
      description: (formData.description || "").trim(),
      skills: (formData.skills || "").trim(),
      tags: toTagsArray(formData.tags),
      githubLink: (formData.githubLink || "").trim(),
      websiteUrl: hasWebsite ? (formData.websiteUrl || "").trim() : "",
      time: (formData.time || "").trim(),
      thumbnailFile: thumbRef.current?.files?.[0] || null,
      project_files: hasWebsite ? null : allFiles,
      projectFiles: hasWebsite ? null : allFiles, // legacy alias
      codeFile: codeRef.current?.files?.[0] || null,
      project_files_paths,
    };

    return payload;
  };

  function normalizeProjectFilesForDB(patch) {
    const out = { ...patch };

    if (typeof out.project_files === "string") {
      try {
        const parsed = JSON.parse(out.project_files);
        out.project_files = Array.isArray(parsed) ? parsed : null;
      } catch {
        out.project_files = null;
      }
    }

    if (Array.isArray(out.project_files) && out.project_files.length === 0) {
      out.project_files = null;
    }

    if (Array.isArray(out.project_files)) {
      out.project_files = out.project_files
        .map((v) => (typeof v === "string" ? v : null))
        .filter(Boolean);

      if (out.project_files.length === 0) {
        out.project_files = null;
      }
    }

    out.tags = toTagsArray(out.tags);

    return out;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrMsg("");

    try {
      let payload = makePayload();

      const files = Array.isArray(payload.project_files) ? payload.project_files : [];
      const hasLocalSite = !payload.websiteUrl && files.length > 0;

      if (hasLocalSite) {
        let project_index_url = null;
        let urls = [];

        if (files.length === 1 && /\.zip$/i.test(files[0]?.name || "")) {
          const uploaded = await uploadZipAsStaticSite({
            zipFile: files[0],
            projectTitle: payload.title || "project",
          });
          project_index_url = uploaded.siteIndexUrl;
          urls = uploaded.allFileUrls;
        } else {
          const res = await uploadProjectFilesToStorage(
            files,
            payload.title || "project"
          );
          project_index_url = res.project_index_url;
          urls = res.urls;
        }

        payload.project_files = urls;
        payload.project_index_url = project_index_url;
      }

      const codeFile = codeRef.current?.files?.[0] || null;
      if (codeFile) {
        const projectSlug =
          (formData?.title || "project")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .slice(0, 50) || "project";

        const now = new Date();
        const stamp = [
          now.getUTCFullYear(),
          String(now.getUTCMonth() + 1).padStart(2, "0"),
          String(now.getUTCDate()).padStart(2, "0"),
          "-",
          String(now.getUTCHours()).padStart(2, "0"),
          String(now.getUTCMinutes()).padStart(2, "0"),
          String(now.getUTCSeconds()).padStart(2, "0"),
        ].join("");

        const cleanName = codeFile.name.replace(/[^\w.\-]/g, "_");
        const pathInBucket = `code/${projectSlug}-${stamp}/${cleanName}`;

        const contentType = mimeFromName(codeFile.name);

        const { error: codeErr } = await supabase.storage
          .from("uploads")
          .upload(pathInBucket, codeFile, {
            contentType,
            upsert: true,
            cacheControl: "public, max-age=31536000, immutable",
          });

        if (codeErr) {
          console.error("Code upload failed:", codeErr);
          throw codeErr;
        }

        const { data: pub } = supabase.storage
          .from("uploads")
          .getPublicUrl(pathInBucket);

        payload.code_file = pub?.publicUrl || "";

        if (setFormData) {
          setFormData((prev) => ({
            ...prev,
            existingCodeFileName: codeFile.name,
          }));
        }
      }

      payload = normalizeProjectFilesForDB(payload);

      if (isEditing && editingId != null) {
        await updateProjectById(editingId, payload);
      } else {
        await createSupaProject(payload);
      }

      clearEverything();
      onSave?.();
      onCancelEdit?.();
    } catch (err) {
      console.error(err);
      setErrMsg(err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetClick = () => {
    clearEverything();
    onCancelEdit?.();
  };

  const hasProjectFiles = pickedProjectFiles.length > 0;
  const hasWebsite = (formData.websiteUrl || "").trim().length > 0;

  return (
    <section className="mx-auto w-full max-w-3xl px-0">
      {/* MENU CARD: solid white, no outer border */}
      <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6 md:p-7 font-inter">
        <h2 className="font-oswald text-blue-700 text-xl sm:text-4xl tracking-wide mb-4">
          Upload Projects
        </h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          {errMsg && (
            <div className="p-2 bg-red-100 text-red-700 rounded">{errMsg}</div>
          )}

          {isEditing && <StoredFilesSummary formData={formData} />}

          {/* Title */}
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              ref={titleRef}
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 caret-blue-600"
              placeholder="Project title"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 caret-blue-600"
              rows={4}
              placeholder="Short summary"
            />
          </div>

          {/* Skills & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Skills</label>
              <input
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 caret-blue-600"
                placeholder="e.g. React, Node"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Tags</label>
              <input
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 caret-blue-600"
                placeholder="comma separated (react, supabase)"
              />
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">GitHub Link</label>
              <input
                name="githubLink"
                value={formData.githubLink}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 caret-blue-600"
                placeholder="https://github.com/…"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Website</label>
              <input
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                disabled={hasProjectFiles}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 caret-blue-600 disabled:opacity-60"
                placeholder="https://example.com/…"
              />
              <p className="text-xs text-gray-600 mt-1">
                If you provide a Website, Project Files will be disabled.
              </p>
            </div>
          </div>

          {/* Time (edit only) */}
          {isEditing && (
            <div>
              <label className="block text-sm mb-1">Time (read-only)</label>
              <input
                name="time"
                value={formData.time || ""}
                readOnly
                disabled
                className="w-full px-3 py-2 rounded-lg border bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="(auto-set; shown on edit)"
              />
            </div>
          )}

          {/* File inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                ref={thumbRef}
                className="
                  w-full p-1 rounded-lg border border-blue-200 bg-white/80
                  focus:outline-none focus:ring-2 focus:ring-blue-300
                  file:bg-blue-300 file:text-black file:rounded-md file:px-3 file:py-1.5
                  file:border-none file:cursor-pointer
                  hover:file:bg-blue-300 hover:file:text-blue-600
                  transition-colors duration-200
                "
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Project Files</label>
              <input
                type="file"
                multiple
                webkitdirectory="true"
                directory="true"
                accept="
                  text/html,text/css,application/javascript,text/javascript,
                  image/*,font/*,application/json,application/xml,
                  application/wasm,application/pdf,application/zip,
                  audio/*,video/*,text/plain
                "
                ref={projRef}
                onChange={handleProjectFilesChange}
                disabled={hasWebsite}
                className="
                  w-full p-1 rounded-lg border border-blue-200 bg-white/80
                  focus:outline-none focus:ring-2 focus:ring-blue-300
                  file:bg-blue-300 file:text-black file:rounded-md file:px-3 file:py-1.5
                  file:border-none file:cursor-pointer
                  hover:file:bg-blue-300 hover:file:text-blue-600
                  transition-colors duration-200
                  disabled:opacity-60
                "
              />
              <p className="text-xs text-gray-600 mt-1">
                <code>If loading files, the website will be disabled.</code>
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1">Code File (optional)</label>
              <input
                type="file"
                ref={codeRef}
                accept=".py,.ipynb,.html,.htm,.js,.ts,.tsx,.jsx,.json,.md,.txt,.capp"
                className="
                  w-full p-1 rounded-lg border border-blue-200 bg-white/80
                  focus:outline-none focus:ring-2 focus:ring-blue-300
                  file:bg-blue-300 file:text-black file:rounded-md file:px-3 file:py-1.5
                  file:border-none file:cursor-pointer
                  hover:file:bg-blue-300 hover:file:text-blue-600
                  transition-colors duration-200
                "
              />
              <p className="text-xs text-gray-600 mt-1">
                Feeds the <strong>Code</strong> viewer.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="
                inline-flex items-center justify-center
                rounded-md
                bg-blue-300
                text-black
                px-4 py-2
                border border-blue-200
                hover:bg-blue-400 hover:text-blue-700
                active:text-blue-800
                focus:outline-none focus:ring-2 focus:ring-blue-300
                disabled:opacity-60
                transition-colors duration-200
              "
              title={submitLabel}
            >
              Submit
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={handleResetClick}
              disabled={submitting}
              className="
                inline-flex items-center justify-center
                rounded-lg
                border border-yellow-300
                bg-yellow-200
                text-black
                font-medium
                px-4 py-2
                hover:text-green-400 hover:bg-yellow-300
                active:text-green-800
                focus:outline-none focus:ring-2 focus:ring-yellow-300
                disabled:opacity-60
                transition-colors duration-200
                ml-auto
              "
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
