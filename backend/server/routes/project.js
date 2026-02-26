// server/routes/projects.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const mime = require('mime');

// ⬇️ OUR utils now expose both read + admin clients.
//    - getClient()        -> safe for SELECTs
//    - getAdminClient()   -> REQUIRED for INSERT/UPDATE/DELETE + Storage writes
const { getClient, getAdminClient, uploadBuffer } = require('../utils/supabase');

// ---- Config (override via env if you need) ----
const TABLE  = process.env.PROJECTS_TABLE || 'Devfolio';  // if your table is 'projects', set env PROJECTS_TABLE=projects
const BUCKET = process.env.PROJECTS_BUCKET || 'uploads';  // you said your bucket is 'uploads'

// Multer in-memory (no disk temp files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Helper: delete an entire "folder" (prefix) in Storage
async function removeAllUnder(bucket, prefix) {
  const supabase = await getAdminClient(); // admin for listing + delete
  let offset = 0;
  const limit = 100;

  for (;;) {
    const { data: entries, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      console.warn('[storage.list]', error.message);
      break;
    }
    if (!entries || entries.length === 0) break;

    const paths = entries.map((e) => `${prefix}/${e.name}`);
    const { error: delErr } = await supabase.storage.from(bucket).remove(paths);
    if (delErr) console.warn('[storage.remove]', delErr.message);

    if (entries.length < limit) break;
    offset += limit;
  }
}

// GET /api/projects  (read-only; anon key OK)
router.get('/', async (_req, res) => {
  try {
    const supabase = await getClient(); // read client
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('time', { ascending: false });

    if (error) return res.status(500).json({ message: 'list failed', error: error.message });
    res.json(data || []);
  } catch (err) {
    console.error('[projects:list]', err);
    res.status(500).json({ message: 'list failed', error: String(err.message || err) });
  }
});

// POST /api/projects  (create row + optional uploads)
router.post(
  '/',
  upload.fields([
    { name: 'thumnail_file', maxCount: 1 },
    { name: 'projectFiles',  maxCount: 1 },
    { name: 'code_file_zip', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const supabase = await getAdminClient(); // ADMIN client for writes

      const {
        title = '',
        description = '',
        skills = '',
        github_link = '',
        web_app_url = '',
        tags = '',
      } = req.body || {};

      if (!title.trim()) {
        return res.status(400).json({ message: 'title is required' });
      }

      // Base row matches your column names (keep "thumnail" spelling if DB uses it)
      const baseRow = {
        title: title.trim(),
        description,
        skills,
        github_link,
        web_app_url,
        tags,
        thumnail: '', // to be filled after file upload
        code_file: '', // to be filled after file upload
      };

      // 1) Create the row first to get an id
      const { data: created, error: insErr } = await supabase
        .from(TABLE)
        .insert([baseRow])
        .select()
        .single();
      if (insErr) throw insErr;

      const rowId = created.id;
      const files = req.files || {};
      const update = {};

      // 2) Upload files (Storage writes use admin client under the hood via uploadBuffer)
      if (files.thumnail_file?.[0]) {
        const f = files.thumnail_file[0];
        const ext = mime.getExtension(f.mimetype) || 'jpg';
        const path = `projects/${rowId}/thumb.${ext}`;
        const publicUrl = await uploadBuffer({
          bucket: BUCKET,
          path,
          buffer: f.buffer,
          contentType: f.mimetype,
          upsert: true,
        });
        update.thumnail = publicUrl;
      }

      if (files.projectFiles?.[0]) {
        const f = files.projectFiles[0];
        const ext = mime.getExtension(f.mimetype) || 'zip';
        const path = `projects/${rowId}/demo.${ext}`;
        const publicUrl = await uploadBuffer({
          bucket: BUCKET,
          path,
          buffer: f.buffer,
          contentType: f.mimetype,
          upsert: true,
        });
        update.web_app_url = publicUrl;
      }

      if (files.code_file_zip?.[0]) {
        const f = files.code_file_zip[0];
        const ext = mime.getExtension(f.mimetype) || 'zip';
        const path = `projects/${rowId}/code.${ext}`;
        const publicUrl = await uploadBuffer({
          bucket: BUCKET,
          path,
          buffer: f.buffer,
          contentType: f.mimetype,
          upsert: true,
        });
        update.code_file = publicUrl;
      }

      // 3) Patch the row with any uploaded URLs
      let finalRow = created;
      if (Object.keys(update).length) {
        const { data: upd, error: upErr } = await supabase
          .from(TABLE)
          .update(update)
          .eq('id', rowId)
          .select()
          .single();
        if (upErr) throw upErr;
        finalRow = upd;
      }

      res.status(201).json(finalRow);
    } catch (err) {
      console.error('[projects:create]', err);
      res.status(500).json({ message: 'create failed', error: String(err.message || err) });
    }
  }
);

// PUT /api/projects/:id  (partial update + optional file replacements)
router.put(
  '/:id',
  upload.fields([
    { name: 'thumnail_file', maxCount: 1 },
    { name: 'projectFiles',  maxCount: 1 },
    { name: 'code_file_zip', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = await getAdminClient(); // ADMIN client for writes

      const partial = {
        title: req.body?.title,
        description: req.body?.description,
        skills: req.body?.skills,
        github_link: req.body?.github_link,
        web_app_url: req.body?.web_app_url,
        tags: req.body?.tags,
      };
      // remove undefineds so we only update sent fields
      Object.keys(partial).forEach((k) => partial[k] === undefined && delete partial[k]);

      const files = req.files || {};

      if (files.thumnail_file?.[0]) {
        const f = files.thumnail_file[0];
        const ext = mime.getExtension(f.mimetype) || 'jpg';
        const path = `projects/${id}/thumb.${ext}`;
        const publicUrl = await uploadBuffer({
          bucket: BUCKET,
          path,
          buffer: f.buffer,
          contentType: f.mimetype,
          upsert: true,
        });
        partial.thumnail = publicUrl;
      }

      if (files.projectFiles?.[0]) {
        const f = files.projectFiles[0];
        const ext = mime.getExtension(f.mimetype) || 'zip';
        const path = `projects/${id}/demo.${ext}`;
        const publicUrl = await uploadBuffer({
          bucket: BUCKET,
          path,
          buffer: f.buffer,
          contentType: f.mimetype,
          upsert: true,
        });
        partial.web_app_url = publicUrl;
      }

      if (files.code_file_zip?.[0]) {
        const f = files.code_file_zip[0];
        const ext = mime.getExtension(f.mimetype) || 'zip';
        const path = `projects/${id}/code.${ext}`;
        const publicUrl = await uploadBuffer({
          bucket: BUCKET,
          path,
          buffer: f.buffer,
          contentType: f.mimetype,
          upsert: true,
        });
        partial.code_file = publicUrl;
      }

      const { data, error } = await supabase
        .from(TABLE)
        .update(partial)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ message: 'update failed', error: error.message });
      if (!data)  return res.status(404).json({ message: 'not found' });
      res.json(data);
    } catch (err) {
      console.error('[projects:update]', err);
      res.status(500).json({ message: 'update failed', error: String(err.message || err) });
    }
  }
);

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = await getAdminClient(); // ADMIN client for writes

    // nuke storage folder for this row
    await removeAllUnder(BUCKET, `projects/${id}`);

    const { error: delErr } = await supabase.from(TABLE).delete().eq('id', id);
    if (delErr) return res.status(500).json({ message: 'delete failed', error: delErr.message });

    res.json({ ok: true, id });
  } catch (err) {
    console.error('[projects:delete]', err);
    res.status(500).json({ message: 'delete failed', error: String(err.message || err) });
  }
});

module.exports = router;
