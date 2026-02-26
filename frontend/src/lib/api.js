// devfolio-client/src/lib/api.js
import axios from "axios";
import { getAdminToken } from "./auth";

// Same-origin API; no CORS.
// Keep a sensible timeout so bad networks don't hang forever.
const api = axios.create({
  baseURL: "/api",
  timeout: 20000,
});

// Attach admin token (if present) to every request.
api.interceptors.request.use((config) => {
  const tok = getAdminToken?.();
  if (tok) config.headers.Authorization = `Bearer ${tok}`;
  // Helps some servers distinguish XHR/fetch from ordinary page navigations
  config.headers["X-Requested-With"] = "XMLHttpRequest";
  return config;
});

/* ───────────────── 401 handler (admin-only redirect) ─────────────────
   If a request fails with 401 while you're on an /admin page,
   send you to /_/login and preserve the exact destination in ?next=.
   On public pages, do NOT hijack navigation — just reject.
--------------------------------------------------------------------- */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    try {
      const status = error?.response?.status;
      if (status === 401) {
        const path = window.location.pathname || "/";
        const onAdmin = path.startsWith("/admin");
        if (onAdmin) {
          const next = encodeURIComponent(
            path + (window.location.search || "") + (window.location.hash || "")
          );
          const dest = `/_/login?next=${next}`;
          if (window.location.hash && window.location.hash.startsWith("#/")) {
            const base = window.location.href.split("#")[0];
            window.location.replace(`${base}#${dest}`);
          } else {
            window.location.replace(dest);
          }
        }
      }
    } catch {
      // swallow any window/location mishaps and just reject
    }
    return Promise.reject(error);
  }
);

// Default export: the configured axios instance
export default api;

/* ───────────── Admin ───────────── */
export async function adminLogin({ username, password }) {
  const { data } = await api.post("/admin/login", { username, password });
  return data;
}

export async function adminVerify() {
  const { data } = await api.get("/admin/verify");
  return data;
}

/* ─────────── Projects (JSON) ───────────
   Use these when sending plain objects (no files). */
export async function listProjects(params = {}) {
  const { data } = await api.get("/projects", { params });
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post("/projects", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

export async function updateProject(id, payload) {
  if (!id) throw new Error("updateProject: id required");
  const { data } = await api.put(`/projects/${id}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

export async function deleteProject(id) {
  if (!id) throw new Error("deleteProject: id required");
  const { data } = await api.delete(`/projects/${id}`);
  return data;
}

/* ─────── Projects (FormData / multipart) ───────
   Use these when AddProjectForm builds a FormData (with files). */
export async function createProjectFD(formData) {
  const { data } = await api.post("/projects", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateProjectFD(id, formData) {
  if (!id) throw new Error("updateProjectFD: id required");
  const { data } = await api.put(`/projects/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/* ─────────────── Generic GET/POST wrappers (for analytics etc.) ─────────────── */
export async function apiGet(url, config = {}) {
  const { data } = await api.get(url, config);
  return data;
}

export async function apiPost(url, body = {}, config = {}) {
  const { data } = await api.post(url, body, config);
  return data;
}
