// src/pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../lib/api";
import { setAdminToken } from "../lib/auth"; // unified helper


export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      // call backend route /api/admin/login
      const res = await adminLogin({ username, password });

      // backend should return { token: "..." }
      const token = res?.token || "";

      // store token in localStorage (using unified helper)
      setAdminToken(token);

      // immediately redirect to admin dashboard (HashRouter-safe)
      navigate("/admin", { replace: true });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Login failed. Check credentials.";
      setErr(msg);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl shadow"
      >
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        {err && <div className="text-red-600 text-center">{err}</div>}

        <input
          className="w-full border p-2 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
