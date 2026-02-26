// backend/server/controllers/authController.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

// NOTE: You told me not to touch env creds, so we use env only.
function getEnvAdmin() {
  const username = (process.env.ADMIN_USERNAME || process.env.ADMIN_USER || "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || "").trim();
  return { username, password };
}

// POST /api/admin/login
async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    const env = getEnvAdmin();

    if (!env.username || !env.password) {
      return res.status(500).json({ error: "Admin env vars missing (ADMIN_USERNAME / ADMIN_PASSWORD)" });
    }

    const u = String(username || "").trim().toLowerCase();
    const p = String(password || "");

    if (u !== env.username || p !== env.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ sub: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: "Login failed" });
  }
}

// POST /api/admin/change-password
// You can’t persist this without a DB; keeping route but making it explicit.
async function changePassword(_req, res) {
  return res.status(400).json({
    error: "Password changes are disabled. Update ADMIN_PASSWORD in your environment variables.",
  });
}

// Kept for compatibility with index.js boot flow
async function ensureInitialAdmin() {
  return;
}

module.exports = { login, changePassword, ensureInitialAdmin };