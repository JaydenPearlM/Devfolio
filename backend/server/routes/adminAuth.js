// server/routes/adminAuth.js
const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { verifyAdmin } = require('../middleware/auth');
const auth = require('../controllers/authController');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_USER || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || '';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'please_change_this';

// ─────────────────────────────────────────────
// DEBUG route: check if env vars are loaded
// (optional; remove after confirming)
router.get('/env-check', (req, res) => {
  res.json({
    has_USER: !!(process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL),
    has_PASS: !!process.env.ADMIN_PASSWORD,
    user_key: process.env.ADMIN_USERNAME
      ? 'ADMIN_USERNAME'
      : process.env.ADMIN_EMAIL
      ? 'ADMIN_EMAIL'
      : null,
  });
});
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// LOGIN (DB-backed, auto-seeded from env if empty)
// POST /api/admin/login
router.post('/login', auth.login);

// ─────────────────────────────────────────────
// CHANGE PASSWORD (JWT required)
// POST /api/admin/change-password
router.post('/change-password', verifyAdmin, auth.changePassword);

// ─────────────────────────────────────────────
module.exports = router;
