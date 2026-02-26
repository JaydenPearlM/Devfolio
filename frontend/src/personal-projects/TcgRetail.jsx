// src/pages/TcgRetail.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function TcgRetail() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-3xl font-oswald font-bold text-blue-700 mb-2">PackPal</h1>
        <p className="text-blue-700/80 mb-6">
          Coming soon — hobby shop tools for inventory, pricing, and drop alerts.
        </p>
        <div className="h-1 w-32 mx-auto bg-blue-500 rounded-full mb-6" />
        <Link
          to="/"
          className="inline-block mt-8 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
