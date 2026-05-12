// devfolio-client/src/lib/supaProjects.js
// Supabase helpers for Devfolio projects (handles Storage + DB)
// NO CORS, client-side Supabase only.

import { supabase } from "./supabaseClient";

/* ─────────────────────────── Config ─────────────────────────── */
const TABLE = "Devfolio";
const BUCKET_THUMBS = "thumbnails";
const BUCKET_PROJECTS = "projectFiles";

// Your DB column is singular:
const COL_PROJECT_FILES = "project_files";

/* ──────────────────────── MIME + helpers ─────────────────────── */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".cjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
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
  if (!Array.isArray(v)) return [];
  return v.map(String).map((s) => s.trim()).filter(Boolean);
}

function nullableString(v) {
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

async function uploadProjectFiles(files = [], title) {
  if (!files || files.length === 0) {
    return { folder: "", filePublicUrls: [], indexUrl: "" };
  }

  const folder = `${slugify(title) || "project"}-${stamp()}`;
  const uploadedPaths = [];
  const publicUrls = [];

  for (const f of files) {
    const rel = f.webkitRelativePath || f.name;
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
  const {
    title,
    description,
    skills,
    software,
    tags,
    githubLink,
    websiteUrl,
    time,
    thumbnailFile,
    project_files,
    project_index_url: payloadIndexUrl,
    code_file: payloadCodeFile,
  } = payload;

  const { url: thumbUrl } = await uploadThumbnail(thumbnailFile, title);

  let project_files_urls = [];
  let derivedIndexUrl = "";
  if (Array.isArray(project_files) && project_files.length > 0) {
    if (typeof project_files[0] === "string") {
      project_files_urls = normalizeTextArray(project_files);
    } else {
      const up = await uploadProjectFiles(project_files, title);
      project_files_urls = normalizeTextArray(up.filePublicUrls);
      derivedIndexUrl = up.indexUrl;
    }
  }

  const finalIndexUrl =
    nullableString(payloadIndexUrl) ||
    nullableString(derivedIndexUrl) ||
    "";

  const row = {
    title: nullableString(title),
    description: nullableString(description),
    skills: Array.isArray(skills)
      ? normalizeTextArray(skills)
      : nullableString(skills),
    software: Array.isArray(software)
      ? normalizeTextArray(software)
      : nullableString(software),
    tags: Array.isArray(tags)
      ? normalizeTextArray(tags)
      : nullableString(tags) ?? null,
    github_link: nullableString(githubLink) ?? "",
    web_app_url: nullableString(websiteUrl) ?? "",
    thumbnail: nullableString(thumbUrl) ?? "",
    [COL_PROJECT_FILES]: normalizeTextArray(project_files_urls),
    project_index_url: finalIndexUrl,
    code_file: payloadCodeFile ? String(payloadCodeFile) : "",
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
    software = current.software,
    tags = current.tags,
    githubLink = current.github_link,
    websiteUrl = current.web_app_url,
    thumbnailFile,
    project_files = [],
    project_index_url: payloadIndexUrl,
    code_file: payloadCodeFile,
  } = payload;

  let thumbUrl = current.thumbnail || "";
  if (thumbnailFile) {
    const up = await uploadThumbnail(thumbnailFile, title);
    thumbUrl = up.url;
  }

  let project_files_urls = Array.isArray(current[COL_PROJECT_FILES])
    ? normalizeTextArray(current[COL_PROJECT_FILES])
    : [];
  let derivedIndexUrl = current.project_index_url || "";

  if (Array.isArray(project_files) && project_files.length > 0) {
    if (typeof project_files[0] === "string") {
      project_files_urls = normalizeTextArray(project_files);
    } else {
      const up = await uploadProjectFiles(project_files, title);
      project_files_urls = normalizeTextArray(up.filePublicUrls);
      derivedIndexUrl = up.indexUrl;
    }
  }

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
    software: Array.isArray(software)
      ? normalizeTextArray(software)
      : nullableString(software),
    tags: Array.isArray(tags)
      ? normalizeTextArray(tags)
      : nullableString(tags) ?? null,
    github_link: nullableString(githubLink) ?? "",
    web_app_url: nullableString(websiteUrl) ?? "",
    thumbnail: nullableString(thumbUrl) ?? "",
    [COL_PROJECT_FILES]: normalizeTextArray(project_files_urls),
    project_index_url: finalIndexUrl,
    code_file: payloadCodeFile
      ? String(payloadCodeFile)
      : current.code_file || "",
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

export async function listSupaProjects({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function listAllProjects(opts) {
  return listSupaProjects(opts);
}

export async function deleteProjectById(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function uploadToProjectFilesBucket(path, fileOrBlob, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET_PROJECTS)
    .upload(path, fileOrBlob, {
      contentType,
      upsert: true,
      cacheControl: "public, max-age=31536000, immutable",
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_PROJECTS).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}