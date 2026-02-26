// devfolio/server/controllers/projectController.js
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const unzipper = require('unzipper');     // for assets/demo zips
const AdmZip = require('adm-zip');        // for code zips
const Project = require('../models/Project');
const { supabase } = require('../utils/supabase');


const ROOT_DIR   = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');
const DEMOS_DIR  = path.join(ROOT_DIR, 'public', 'demos');
const CODE_ROOT  = path.join(UPLOAD_DIR, 'code'); // filesystem base for code zips

// ensure required dirs exist (once)
(async () => {
  try { await fsp.mkdir(UPLOAD_DIR, { recursive: true }); } catch {}
  try { await fsp.mkdir(DEMOS_DIR,  { recursive: true }); } catch {}
  try { await fsp.mkdir(CODE_ROOT,  { recursive: true }); } catch {}
})();

/* ----------------------------- helpers ---------------------------------- */

// split "a, b, c" -> ["a","b","c"]
function splitList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
}

// recursively find first index.html under root; returns relative POSIX path or null
async function findIndexHtmlRelative(root) {
  const stack = ['']; // '' == root
  while (stack.length) {
    const rel = stack.pop();
    const dir = path.join(root, rel);
    let entries = [];
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch { continue; }

    for (const ent of entries) {
      const entRel = path.join(rel, ent.name);
      if (ent.isDirectory()) {
        stack.push(entRel);
      } else if (ent.isFile() && ent.name.toLowerCase() === 'index.html') {
        return entRel.split(path.sep).join('/'); // URL-friendly
      }
    }
  }
  return null;
}

// unzip a file to destination, then locate index.html (for demos/assets)
async function unzipAndLocateIndex(zipFileFullPath, destDir) {
  await fsp.mkdir(destDir, { recursive: true });
  await new Promise((resolve, reject) => {
    fs.createReadStream(zipFileFullPath)
      .pipe(unzipper.Extract({ path: destDir }))
      .on('close', resolve)
      .on('error', reject);
  });
  return await findIndexHtmlRelative(destDir);
}

// build a public URL for demos with a given projectId and relative index path
function demoUrl(projectId, relIndexPath) {
  const rel = (relIndexPath || 'index.html').replace(/\\/g, '/');
  // If your server statically serves DEMOS_DIR at /demos:
  return `/demos/${projectId}/${rel}`;
  // If you instead serve the whole public app at /app, change to:
  // return `/app/demos/${projectId}/${rel}`;
}

// list all files recursively under a root, returning paths relative to that root (POSIX style)
function listFilesRecursively(rootAbs) {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else out.push(abs);
    }
  })(rootAbs);
  return out.map(p => path.relative(rootAbs, p).replace(/\\/g, '/'));
}

/* ---------------------------- controllers -------------------------------- */

// Alias expected by some routes
exports.getAllProjects = async (_req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('getAllProjects error:', err);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};
// Keep original name too, if other code calls it
exports.getProjects = exports.getAllProjects;

exports.getProjectById = async (req, res) => {
  try {
    const doc = await Project.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    console.error('getProjectById error:', err);
    res.status(500).json({ error: 'Failed to get project' });
  }
};

// POST new project (assets ZIP + optional thumbnail + optional codeZip)
// POST new project (assets ZIP + optional thumbnail + optional codeZip)
exports.createProject = async (req, res) => {
  try {
    const {
      title = '',
      description = '',
      skills = '',
      githubLink = '',
      linkedinLink = '',
      tags = '',
      demoLink = ''
    } = req.body || {};

    if (!title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const assetsZip = req.files?.assets?.[0]   || null; // demo assets zip (for /public/demos)
    const codeZip   = req.files?.codeZip?.[0]  || null; // code zip (for /uploads/code)
    const thumbFile = req.files?.thumbnail?.[0]|| null;

    // Prepare project (need _id up front)
    const project = new Project({
      title: title.trim(),
      description,
      skills: splitList(skills),
      tags: splitList(tags),
      githubLink: githubLink || '',
      linkedinLink: linkedinLink || '',
      thumbnail: '',
      fileUploads: [],
      demoLink: demoLink || '',
      codeRootDir: undefined,
      codeFiles: [],
      codeZipUrl: undefined
    });

    const projectId = project._id.toString();

    // Thumbnail
    if (thumbFile) {
      project.thumbnail = `uploads/${thumbFile.filename}`;
      project.fileUploads.push(project.thumbnail);
    }

    // DEMO ZIP → /public/demos/<id> with auto index.html detection
    if (assetsZip) {
      const zipFull = path.join(UPLOAD_DIR, assetsZip.filename);
      const dest    = path.join(DEMOS_DIR, projectId);

      const relIndex = await unzipAndLocateIndex(zipFull, dest);
      if (!relIndex) {
        return res.status(400).json({ error: 'ZIP must contain an index.html (root or any subfolder)' });
      }

      project.fileUploads.push(`uploads/${assetsZip.filename}`); // keep original uploaded zip
      project.demoLink = demoUrl(projectId, relIndex);
    }

    // Save now so we persist the base doc (and its id)
    await project.save();

    // CODE ZIP → /uploads/code/<id> and record file list
    if (codeZip) {
      const zipFileFullPath = path.join(UPLOAD_DIR, codeZip.filename);
      const extractDirFs    = path.join(CODE_ROOT, projectId);
      await fsp.mkdir(extractDirFs, { recursive: true });

      const zip = new AdmZip(zipFileFullPath);
      zip.extractAllTo(extractDirFs, true);

      project.codeRootDir = `/uploads/code/${projectId}`;
      project.codeFiles   = listFilesRecursively(extractDirFs);
      project.codeZipUrl  = `uploads/${codeZip.filename}`;
      project.fileUploads.push(`uploads/${codeZip.filename}`);

      await project.save();
    }

    // 🌐 Supabase Sync Block — hybrid cloud/local storage integration
    try {
      const { supabase } = require('../utils/supabase');

      const { data, error } = await supabase.from('Devfolio').insert([{
        title: project.title,
        description: project.description,
        skills: project.skills,
        githubLink: project.githubLink,
        webappURL: project.demoLink,  // maps to your live demo URL
        image_url: project.thumbnail, // Supabase public image
        code: project.codeZipUrl,     // path to uploaded zip
        tags: project.tags
      }]);

      if (error) console.error('Supabase insert error:', error);
      else console.log('✅ Synced to Supabase:', data);
    } catch (syncErr) {
      console.error('Supabase sync failed:', syncErr.message);
    }

    // Return created project
    return res.status(201).json(project);
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// PUT update project (accept new assets ZIP, thumbnail, and/or codeZip)
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // text fields
    if (req.body.title != null)        project.title = String(req.body.title);
    if (req.body.description != null)  project.description = String(req.body.description);
    if (req.body.githubLink != null)   project.githubLink = String(req.body.githubLink);
    if (req.body.linkedinLink != null) project.linkedinLink = String(req.body.linkedinLink);
    if (req.body.skills != null)       project.skills = splitList(req.body.skills);
    if (req.body.tags != null)         project.tags   = splitList(req.body.tags);

    const assetsZip = req.files?.assets?.[0]   || null;
    const codeZip   = req.files?.codeZip?.[0]  || null;
    const thumbFile = req.files?.thumbnail?.[0]|| null;

    // thumbnail
    if (thumbFile) {
      project.thumbnail = `uploads/${thumbFile.filename}`;
      project.fileUploads = project.fileUploads || [];
      project.fileUploads.push(project.thumbnail);
    }

    // replace DEMO zip → wipe old extracted files and re-unzip
    if (assetsZip) {
      const zipFull = path.join(UPLOAD_DIR, assetsZip.filename);
      const dest    = path.join(DEMOS_DIR, id);

      // clean dest (ignore errors)
      try {
        const entries = await fsp.readdir(dest, { withFileTypes: true });
        await Promise.all(entries.map(ent =>
          fsp.rm(path.join(dest, ent.name), { recursive: true, force: true })
        ));
      } catch {}

      const relIndex = await unzipAndLocateIndex(zipFull, dest);
      if (!relIndex) {
        return res.status(400).json({ error: 'ZIP must contain an index.html (root or any subfolder)' });
      }

      project.demoLink = demoUrl(id, relIndex);
      project.fileUploads = project.fileUploads || [];
      project.fileUploads.push(`uploads/${assetsZip.filename}`);
    }

    // replace codeZip → wipe old extracted code and re-extract
    if (codeZip) {
      const zipFileFullPath = path.join(UPLOAD_DIR, codeZip.filename);
      const extractDirFs    = path.join(CODE_ROOT, id);

      // clean old code dir
      try { await fsp.rm(extractDirFs, { recursive: true, force: true }); } catch {}
      await fsp.mkdir(extractDirFs, { recursive: true });

      const zip = new AdmZip(zipFileFullPath);
      zip.extractAllTo(extractDirFs, true);

      project.codeRootDir = `/uploads/code/${id}`;
      project.codeFiles   = listFilesRecursively(extractDirFs);
      project.codeZipUrl  = `uploads/${codeZip.filename}`;
      project.fileUploads = project.fileUploads || [];
      project.fileUploads.push(`uploads/${codeZip.filename}`);
    }

    const updated = await project.save();
    res.json(updated);
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE project + its files (remove extracted demo & uploaded zips/thumbnail + code dir)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // remove extracted demo folder
    const demoFolder = path.join(DEMOS_DIR, String(project._id));
    try { await fsp.rm(demoFolder, { recursive: true, force: true }); } catch {}

    // remove extracted code folder
    const codeFolder = path.join(CODE_ROOT, String(project._id));
    try { await fsp.rm(codeFolder, { recursive: true, force: true }); } catch {}

    // remove uploaded files we tracked
    const removeFile = async (rel) => {
      try { await fsp.rm(path.join(ROOT_DIR, rel), { force: true }); } catch {}
    };
    if (project.fileUploads?.length) {
      await Promise.all(project.fileUploads.map(removeFile));
    }
    if (project.thumbnail) {
      await removeFile(project.thumbnail);
    }

    await project.deleteOne();
    res.json({ message: 'Project and files deleted' });
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
