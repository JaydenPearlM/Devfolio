// backend/server/routes/projects.js

import express from "express";
import mime from "mime";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";

import upload from "../middleware/upload.js";
import { verifyAdmin } from "../middleware/auth.js";
import { getClient, getAdminClient, uploadBuffer } from "../utils/supabase.js";

const router = express.Router();

const TABLE = process.env.PROJECTS_TABLE || "Devfolio";
const BUCKET = process.env.PROJECTS_BUCKET || "uploads";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_DIR = path.resolve(__dirname, "..");
const PUBLIC_ROOT = path.join(SERVER_DIR, "public");
const DEMOS_ROOT = path.join(PUBLIC_ROOT, "demos");

if (!fs.existsSync(DEMOS_ROOT)) {
  fs.mkdirSync(DEMOS_ROOT, { recursive: true });
}

/*
  parseTags converts whatever arrives in req.body.tags into a proper
  JS array. The frontend sends JSON.stringify(array) so we receive a
  string like '["machine-learning","react"]'. Postgres ARRAY columns
  need a real JS array from the Supabase client, not a JSON string.
*/
function parseTags(raw) {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // not JSON -- treat as plain comma separated text
    }
    return raw.split(",").map((t) => t.trim()).filter(Boolean);
  }

  return [];
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function uniqueDemoFolder(title = "") {
  const stamp = Date.now();
  const slug = slugify(title) || "project";
  return `${stamp}-${slug}`;
}

function normalizeRelativePath(input = "") {
  const raw = String(input || "").replace(/\\/g, "/").trim();
  const parts = raw
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => p !== "." && p !== "..");
  return parts.join("/");
}

function buildPublicDemoUrl(req, demoFolder, relativePath) {
  const safePath = normalizeRelativePath(relativePath)
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${req.protocol}://${req.get("host")}/public/demos/${encodeURIComponent(
    demoFolder
  )}/${safePath}`;
}

function pickBestIndexPath(paths = []) {
  if (!Array.isArray(paths) || paths.length === 0) return "";

  const normalized = paths.map((p) => normalizeRelativePath(p)).filter(Boolean);

  const exactPriority = [
    "dist/index.html",
    "build/index.html",
    "public/index.html",
    "index.html",
  ];

  for (const wanted of exactPriority) {
    const hit = normalized.find((p) => p.toLowerCase() === wanted);
    if (hit) return hit;
  }

  const nestedIndex = normalized.find((p) =>
    p.toLowerCase().endsWith("/index.html")
  );
  if (nestedIndex) return nestedIndex;

  const anyHtml = normalized.find((p) => /\.html?$/i.test(p));
  return anyHtml || "";
}

async function ensureParentDir(filePath) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
}

async function removeIfExists(targetPath) {
  try {
    await fsp.rm(targetPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

async function cleanupTempUploads(files = []) {
  await Promise.all(
    files.map(async (file) => {
      if (!file?.path) return;
      try {
        await fsp.unlink(file.path);
      } catch {
        // ignore
      }
    })
  );
}

async function fileBufferFromDisk(file) {
  if (!file?.path) throw new Error("Uploaded file path missing");
  return fsp.readFile(file.path);
}

async function removeAllUnder(bucket, prefix) {
  const supabase = getAdminClient();
  let offset = 0;
  const limit = 100;

  for (;;) {
    const { data: entries, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });

    if (error) { console.warn("[storage.list]", error.message); break; }
    if (!entries || entries.length === 0) break;

    const paths = entries.map((e) => `${prefix}/${e.name}`);
    const { error: delErr } = await supabase.storage.from(bucket).remove(paths);
    if (delErr) console.warn("[storage.remove]", delErr.message);

    if (entries.length < limit) break;
    offset += limit;
  }
}

/*
  POST /api/projects/demo-upload
*/
router.post("/demo-upload", verifyAdmin, upload.array("projectFiles", 500), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const title = String(req.body?.title || "project").trim();
  const demoFolder = uniqueDemoFolder(title);
  const demoRoot = path.join(DEMOS_ROOT, demoFolder);

  try {
    if (files.length === 0) {
      return res.status(400).json({ message: "No project files were uploaded." });
    }

    await fsp.mkdir(demoRoot, { recursive: true });

    let writtenRelativePaths = [];
    const rawPathsInput = req.body?.project_files_paths;
    let providedPaths = [];

    if (typeof rawPathsInput === "string" && rawPathsInput.trim()) {
      try {
        const parsed = JSON.parse(rawPathsInput);
        if (Array.isArray(parsed)) {
          providedPaths = parsed.map((p) => normalizeRelativePath(p));
        }
      } catch {
        providedPaths = [];
      }
    }

    const isSingleZip =
      files.length === 1 && /\.zip$/i.test(files[0]?.originalname || "");

    if (isSingleZip) {
      const zip = new AdmZip(files[0].path);
      const entries = zip.getEntries().filter((e) => !e.isDirectory);

      for (const entry of entries) {
        const relPath = normalizeRelativePath(entry.entryName);
        if (!relPath) continue;
        const targetPath = path.join(demoRoot, relPath);
        await ensureParentDir(targetPath);
        await fsp.writeFile(targetPath, entry.getData());
        writtenRelativePaths.push(relPath);
      }
    } else {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const relPath =
          normalizeRelativePath(providedPaths[i]) ||
          normalizeRelativePath(file.originalname) ||
          normalizeRelativePath(file.filename);

        if (!relPath) continue;
        const targetPath = path.join(demoRoot, relPath);
        await ensureParentDir(targetPath);
        await fsp.copyFile(file.path, targetPath);
        writtenRelativePaths.push(relPath);
      }
    }

    writtenRelativePaths = [...new Set(writtenRelativePaths)];
    const bestIndex = pickBestIndexPath(writtenRelativePaths);

    if (!bestIndex) {
      await removeIfExists(demoRoot);
      return res.status(400).json({
        message:
          "Could not create a live demo. Upload a static site with index.html, or upload a built app folder like dist/ or build/. Raw TSX/JSX/TS source alone cannot be shown as View until it is built.",
      });
    }

    const project_index_url = buildPublicDemoUrl(req, demoFolder, bestIndex);
    const project_files = writtenRelativePaths.map((rel) =>
      buildPublicDemoUrl(req, demoFolder, rel)
    );

    return res.status(201).json({
      ok: true,
      demo_folder: demoFolder,
      index_path: bestIndex,
      project_index_url,
      project_files,
    });
  } catch (err) {
    console.error("[projects:demo-upload]", err);
    await removeIfExists(demoRoot);
    return res.status(500).json({
      message: "Demo processing failed",
      error: String(err?.message || err),
    });
  } finally {
    await cleanupTempUploads(files);
  }
});

/*
  GET /api/projects
*/
router.get("/", async (_req, res) => {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("time", { ascending: false });

    if (error) return res.status(500).json({ message: "list failed", error: error.message });
    res.json(data || []);
  } catch (err) {
    console.error("[projects:list]", err);
    res.status(500).json({ message: "list failed", error: String(err.message || err) });
  }
});

/*
  POST /api/projects
*/
router.post(
  "/",
  verifyAdmin,
  upload.fields([
    { name: "thumnail_file", maxCount: 1 },
    { name: "code_file_zip", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const supabase = getAdminClient();

      const {
        title = "",
        description = "",
        skills = "",
        github_link = "",
        linkedin_link = "",
        blog_link = "",
        web_app_url = "",
        project_index_url = "",
      } = req.body || {};

      if (!title.trim()) {
        return res.status(400).json({ message: "title is required" });
      }

      const effectiveUrl = project_index_url.trim() || web_app_url.trim();

      const baseRow = {
        title: title.trim(),
        description,
        skills,
        github_link,
        linkedin_link,
        blog_link,
        web_app_url: effectiveUrl,
        project_index_url: project_index_url.trim(),
        tags: parseTags(req.body?.tags),
        thumbnail: "",
        code_file: "",
      };

      const { data: created, error: insErr } = await supabase
        .from(TABLE)
        .insert([baseRow])
        .select()
        .single();

      if (insErr) throw insErr;

      const rowId = created.id;
      const files = req.files || {};
      const update = {};

      if (files.thumnail_file?.[0]) {
        const f = files.thumnail_file[0];
        const buffer = await fileBufferFromDisk(f);
        const ext = mime.getExtension(f.mimetype) || "jpg";
        update.thumbnail = await uploadBuffer({
          bucket: BUCKET,
          path: `projects/${rowId}/thumb.${ext}`,
          buffer,
          contentType: f.mimetype,
          upsert: true,
        });
      }

      if (files.code_file_zip?.[0]) {
        const f = files.code_file_zip[0];
        const buffer = await fileBufferFromDisk(f);
        const ext = mime.getExtension(f.mimetype) || "zip";
        update.code_file = await uploadBuffer({
          bucket: BUCKET,
          path: `projects/${rowId}/code.${ext}`,
          buffer,
          contentType: f.mimetype,
          upsert: true,
        });
      }

      let finalRow = created;

      if (Object.keys(update).length) {
        const { data: upd, error: upErr } = await supabase
          .from(TABLE)
          .update(update)
          .eq("id", rowId)
          .select()
          .single();

        if (upErr) throw upErr;
        finalRow = upd;
      }

      res.status(201).json(finalRow);
    } catch (err) {
      console.error("[projects:create]", err);
      res.status(500).json({ message: "create failed", error: String(err.message || err) });
    } finally {
      const allFiles = Object.values(req.files || {}).flat();
      await cleanupTempUploads(allFiles);
    }
  }
);

/*
  PUT /api/projects/:id
*/
router.put(
  "/:id",
  verifyAdmin,
  upload.fields([
    { name: "thumnail_file", maxCount: 1 },
    { name: "code_file_zip", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = getAdminClient();

      const {
        title,
        description,
        skills,
        github_link,
        linkedin_link,
        blog_link,
        web_app_url,
        project_index_url,
      } = req.body || {};

      const effectiveUrl = project_index_url?.trim() || web_app_url?.trim();

      const partial = {
        title,
        description,
        skills,
        github_link,
        linkedin_link,
        blog_link,
        web_app_url: effectiveUrl,
        project_index_url: project_index_url?.trim(),
        tags: parseTags(req.body?.tags),
      };

      Object.keys(partial).forEach((k) => {
        if (partial[k] === undefined) delete partial[k];
      });

      const files = req.files || {};

      if (files.thumnail_file?.[0]) {
        const f = files.thumnail_file[0];
        const buffer = await fileBufferFromDisk(f);
        const ext = mime.getExtension(f.mimetype) || "jpg";
        partial.thumbnail = await uploadBuffer({
          bucket: BUCKET,
          path: `projects/${id}/thumb.${ext}`,
          buffer,
          contentType: f.mimetype,
          upsert: true,
        });
      }

      if (files.code_file_zip?.[0]) {
        const f = files.code_file_zip[0];
        const buffer = await fileBufferFromDisk(f);
        const ext = mime.getExtension(f.mimetype) || "zip";
        partial.code_file = await uploadBuffer({
          bucket: BUCKET,
          path: `projects/${id}/code.${ext}`,
          buffer,
          contentType: f.mimetype,
          upsert: true,
        });
      }

      const { data, error } = await supabase
        .from(TABLE)
        .update(partial)
        .eq("id", id)
        .select()
        .single();

      if (error) return res.status(500).json({ message: "update failed", error: error.message });

      res.json(data);
    } catch (err) {
      console.error("[projects:update]", err);
      res.status(500).json({ message: "update failed", error: String(err.message || err) });
    } finally {
      const allFiles = Object.values(req.files || {}).flat();
      await cleanupTempUploads(allFiles);
    }
  }
);

/*
  DELETE /api/projects/:id
*/
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getAdminClient();

    await removeAllUnder(BUCKET, `projects/${id}`);

    const { error: delErr } = await supabase.from(TABLE).delete().eq("id", id);

    if (delErr) return res.status(500).json({ message: "delete failed", error: delErr.message });

    res.json({ ok: true, id });
  } catch (err) {
    console.error("[projects:delete]", err);
    res.status(500).json({ message: "delete failed", error: String(err.message || err) });
  }
});

export default router;