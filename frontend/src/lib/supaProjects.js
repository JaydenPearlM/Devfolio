// devfolio-client/src/lib/supaProjects.js
// Supabase helpers for Devfolio projects (handles Storage + DB)
// NO CORS, client-side Supabase only.

import { supabase } from "./supabaseClient";

/* ─────────────────────────── Config ─────────────────────────── */
const TABLE = "Devfolio";
const BUCKET_THUMBS = "thumbnails";
const BUCKET_PROJECTS = "projectFiles";

// ✅ Your DB column is singular:
const COL_PROJECT_FILES = "project_files";

/* ──────────────────────── MIME + helpers ─────────────────────── */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm":  "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".cjs":  "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
  ".wasm": "application/wasm",
  ".txt":  "text/plain; charset=utf-8",
  ".pdf":  "application/pdf",
};

function extname(name = "") {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 50);
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    p(d.getUTCMonth() + 1) +
    p(d.getUTCDate()) +
    "-" +
    p(d.getUTCHours()) +
    p(d.getUTCMinutes()) +
    p(d.getUTCSeconds())
  );
}

/* ───────────────────────── Normalizers ───────────────────────── */

function normalizeTextArray(v) {
  // Always return a string[] (never ""), safe for text[] columns
  if (!Array.isArray(v)) return [];
  return v.map(String).map((s) => s.trim()).filter(Boolean);
}

function splitCommaToArray(v) {
  // Accept string "a,b,c" -> ["a","b","c"], array unchanged, null -> []
  if (Array.isArray(v)) return normalizeTextArray(v);
  if (v == null) return [];
  const s = String(v).trim();
  if (!s) return [];
  return normalizeTextArray(s.split(","));
}

function nullableString(v) {
  // Convert empty string -> null (prevents "" from colliding with arrays)
  if (v == null) return null;
  const s = String(v);
  return s.trim() === "" ? null : s;
}

/* ────────────────────── Storage uploaders ────────────────────── */

async function uploadThumbnail(file, title) {
  if (!file) return { url: "", path: "" };

  const folder = `${slugify(title) || "thumb"}-${stamp()}`;
  const path = `${folder}/${file.name}`;

  const contentType =
    file.type || MIME[extname(file.name)] || "application/octet-stream";

  const { error } = await supabase.storage
    .from(BUCKET_THUMBS)
    .upload(path, file, {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_THUMBS).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Upload a set of local Files to Storage (preserving folder structure)
 * and return:
 *  - indexUrl: public URL to index.html (or first .html)
 *  - filePublicUrls: array of public URLs for all uploaded files
 */
async function uploadProjectFiles(files = [], title) {
  if (!files || files.length === 0) {
    return { folder: "", filePublicUrls: [], indexUrl: "" };
  }

  const folder = `${slugify(title) || "project"}-${stamp()}`;
  const uploadedPaths = [];
  const publicUrls = [];

  for (const f of files) {
    const rel = f.webkitRelativePath || f.name; // keep folder structure
    const path = `${folder}/${rel}`.replace(/\/\/+/g, "/");

    const ct =
      (f.type && String(f.type).trim()) ||
      MIME[extname(rel)] ||
      "application/octet-stream";

    const { error } = await supabase.storage
      .from(BUCKET_PROJECTS)
      .upload(path, f, {
        contentType: ct,
        cacheControl: "public, max-age=31536000, immutable",
        upsert: true,
      });

    if (error) throw error;

    uploadedPaths.push(path);

    const { data } = supabase.storage.from(BUCKET_PROJECTS).getPublicUrl(path);
    publicUrls.push(data.publicUrl);
  }

  // Find index.html (prefer /index.html, else any .html)
  let indexPath = uploadedPaths.find((p) => /\/index\.html?$/i.test(p));
  if (!indexPath) {
    indexPath = uploadedPaths.find((p) => /\.html?$/i.test(p)) || "";
  }

  let indexUrl = "";
  if (indexPath) {
    const { data } = supabase.storage
      .from(BUCKET_PROJECTS)
      .getPublicUrl(indexPath);
    indexUrl = data.publicUrl;
  }

  return { folder, filePublicUrls: publicUrls, indexUrl };
}

/* ───────────────────────── CRUD: Projects ─────────────────────── */

export async function createSupaProject(payload) {
  // payload comes from AddProjectForm.makePayload()
  const {
    title,
    description,
    skills, // could be text or text[]
    tags, // could be text or text[]
    githubLink,
    websiteUrl, // external site (optional)
    time,
    thumbnailFile,
    project_files, // File[] or already-uploaded URLs for hosted site
    // ✅ read incoming project_index_url from AddProjectForm (if upload was done there)
    project_index_url: payloadIndexUrl,
    // ✅ code file public URL comes pre-set by AddProjectForm (uploads bucket)
    code_file: payloadCodeFile,
  } = payload;

  // 1) thumbnail
  const { url: thumbUrl } = await uploadThumbnail(thumbnailFile, title);

  // 2) project files (if provided Files[], upload; if URLs, accept as-is)
  let project_files_urls = [];
  let derivedIndexUrl = "";
  if (Array.isArray(project_files) && project_files.length > 0) {
    if (typeof project_files[0] === "string") {
      // already URLs
      project_files_urls = normalizeTextArray(project_files);
      // derivedIndexUrl stays "", because uploads weren't done here
    } else {
      const up = await uploadProjectFiles(project_files, title);
      project_files_urls = normalizeTextArray(up.filePublicUrls);
      derivedIndexUrl = up.indexUrl; // -> project_index_url
    }
  }

  // 3) Final project_index_url:
  // prefer incoming payloadIndexUrl (from form upload), else derivedIndexUrl, else ""
  const finalIndexUrl =
    nullableString(payloadIndexUrl) ||
    nullableString(derivedIndexUrl) ||
    "";

  // 4) Prepare final columns (avoid ever sending "" to array cols)
  const row = {
    title: nullableString(title),
    description: nullableString(description),
    // If DB uses text[] for skills/tags, this will be arrays; if text, they're strings or null.
    skills: Array.isArray(skills)
      ? normalizeTextArray(skills)
      : nullableString(skills),
    tags: Array.isArray(tags)
      ? normalizeTextArray(tags)
      : (nullableString(tags) ?? null),
    github_link: nullableString(githubLink) ?? "",
    web_app_url: nullableString(websiteUrl) ?? "", // external site if provided
    thumbnail: nullableString(thumbUrl) ?? "",
    [COL_PROJECT_FILES]: normalizeTextArray(project_files_urls), // text[] in DB
    project_index_url: finalIndexUrl, // ✅ persist the index
    code_file: payloadCodeFile ? String(payloadCodeFile) : "", // ✅ NEW
    time: nullableString(time) ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectById(id, payload) {
  // Fetch current row so we can preserve URLs if not re-uploaded
  const { data: current, error: getErr } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (getErr) throw getErr;

  const {
    title = current.title,
    description = current.description,
    skills = current.skills,
    tags = current.tags,
    githubLink = current.github_link,
    websiteUrl = current.web_app_url,
    thumbnailFile,
    project_files = [],
    // ✅ read incoming project_index_url on update too
    project_index_url: payloadIndexUrl,
    // ✅ optional new code_file public URL
    code_file: payloadCodeFile,
  } = payload;

  // 1) thumbnail (only if new)
  let thumbUrl = current.thumbnail || "";
  if (thumbnailFile) {
    const up = await uploadThumbnail(thumbnailFile, title);
    thumbUrl = up.url;
  }

  // 2) project files (only if new)
  let project_files_urls = Array.isArray(current[COL_PROJECT_FILES])
    ? normalizeTextArray(current[COL_PROJECT_FILES])
    : [];
  let derivedIndexUrl = current.project_index_url || "";

  if (Array.isArray(project_files) && project_files.length > 0) {
    if (typeof project_files[0] === "string") {
      project_files_urls = normalizeTextArray(project_files);
      // keep existing derivedIndexUrl unless caller uploads a new tree
    } else {
      const up = await uploadProjectFiles(project_files, title);
      project_files_urls = normalizeTextArray(up.filePublicUrls);
      derivedIndexUrl = up.indexUrl;
    }
  }

  // Prefer payloadIndexUrl; else derived; else keep current
  const finalIndexUrl =
    nullableString(payloadIndexUrl) ||
    nullableString(derivedIndexUrl) ||
    current.project_index_url ||
    "";

  const updates = {
    title: nullableString(title),
    description: nullableString(description),
    skills: Array.isArray(skills)
      ? normalizeTextArray(skills)
      : nullableString(skills),
    tags: Array.isArray(tags)
      ? normalizeTextArray(tags)
      : (nullableString(tags) ?? null),
    github_link: nullableString(githubLink) ?? "",
    web_app_url: nullableString(websiteUrl) ?? "",
    thumbnail: nullableString(thumbUrl) ?? "",
    [COL_PROJECT_FILES]: normalizeTextArray(project_files_urls),
    project_index_url: finalIndexUrl,
    code_file: payloadCodeFile
      ? String(payloadCodeFile)
      : (current.code_file || ""), // ✅ preserve existing if none provided
    // time usually not updated
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ─────────── convenience fns used elsewhere in your app ─────────── */

export async function listSupaProjects({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Alias to keep older imports working
export async function listAllProjects(opts) {
  return listSupaProjects(opts);
}

export async function deleteProjectById(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return true;
}

/* ────────────────────── Exposed helpers ────────────────────── */
/**
 * Upload a single file/blob into the `projectFiles` bucket at a given path.
 * Returns { path, publicUrl }.
 *
 * Example:
 *   await uploadProjectFile(`myproj-20251105/index.html`, file);
 */
export async function uploadProjectFile(pathInBucket, fileOrBlob) {
  if (!pathInBucket) throw new Error("uploadProjectFile: missing pathInBucket");
  if (!fileOrBlob) throw new Error("uploadProjectFile: missing file/blob");

  const guessed =
    (fileOrBlob.type && String(fileOrBlob.type).trim()) ||
    MIME[extname(pathInBucket)] ||
    "application/octet-stream";

  const { error } = await supabase.storage
    .from(BUCKET_PROJECTS)
    .upload(pathInBucket, fileOrBlob, {
      cacheControl: "public, max-age=31536000, immutable",
      upsert: true,
      contentType: guessed,
    });

  if (error) throw error;

  const publicUrl = publicUrlFor(pathInBucket);
  return { path: pathInBucket, publicUrl };
}

/**
 * Get a public URL for a stored path in the `projectFiles` bucket.
 */
export function publicUrlFor(pathInBucket) {
  const { data } = supabase
    .storage
    .from(BUCKET_PROJECTS)
    .getPublicUrl(pathInBucket);
  return data?.publicUrl || "";
}

// (Optional) export the bucket name if other modules need it
export const PROJECT_FILES_BUCKET = BUCKET_PROJECTS;
