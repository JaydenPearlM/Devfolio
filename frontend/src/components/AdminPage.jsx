// src/components/AdminPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../lib/api"; // keep if you call backend analytics

export default function AdminPage() {
  // ✅ Hooks are inside the component
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [analytics, setAnalytics] = useState(null);

  // Optional range state (if you use it later)
  const [rangeType, setRangeType] = useState("7"); // '7' | '30' | 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const params =
        rangeType === "custom" && startDate && endDate
          ? { start: startDate, end: endDate }
          : { range: rangeType };

      // If your backend has /api/analytics/admin, this will work; otherwise comment this out.
      const { data } = await api.get("/analytics/admin", { params });
      setAnalytics(data || {});
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [rangeType, startDate, endDate]);

  useEffect(() => {
    // comment out if endpoint not ready
    // fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin</h1>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm">Range:</label>
        <select
          className="border px-2 py-1 rounded"
          value={rangeType}
          onChange={(e) => setRangeType(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="custom">Custom…</option>
        </select>
        {rangeType === "custom" && (
          <>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              className="px-3 py-1 rounded bg-black text-white"
              onClick={fetchAnalytics}
            >
              Apply
            </button>
          </>
        )}
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && !err && (
        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">
{JSON.stringify(analytics, null, 2)}
        </pre>
      )}
    </div>
  );
}
