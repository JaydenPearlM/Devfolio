import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithPassword, useAdminAuth } from "../../lib/auth.jsx";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/admin";

  const { loading, session, isAdmin } = useAdminAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && isAdmin) {
      navigate(next, { replace: true });
    }
  }, [loading, session, isAdmin, next, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("");
    setSubmitting(true);

    try {
      const { error } = await signInWithPassword(identifier, password);

      if (error) {
        setStatus(error.message || "Login failed");
        return;
      }

      navigate(next, { replace: true });
    } catch (err) {
      setStatus(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-2 text-white">Admin Login</h1>
        <p className="text-sm text-white/70 mb-6">
          Use your admin email/password, or the temporary fallback login.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-white/90">
              Username or Email
            </label>
            <input
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              placeholder="Enter username or email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-white/90">
              Password
            </label>
            <input
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-white text-black font-semibold px-4 py-2 disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

          {status ? <div className="text-sm text-red-400">{status}</div> : null}
        </form>

        <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-200">
          <div className="font-semibold mb-1">Temporary fallback login</div>
          <div>Username: jayden</div>
          <div>Password: DevfolioAdmin123!</div>
        </div>
      </div>
    </div>
  );
}