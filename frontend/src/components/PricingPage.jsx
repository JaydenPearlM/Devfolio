import React from "react";

export default function PricingPage() {
  return (
    <div className="min-h-screen w-full px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold">Pricing</h1>
          <p className="mt-2 opacity-80">
            Pick a package or reach out for a custom scope.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Starter */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold mb-1">Starter</h2>
            <p className="text-3xl font-extrabold mb-4">$299</p>
            <ul className="space-y-2 opacity-90">
              <li>1-page landing or simple portfolio</li>
              <li>Basic responsive layout</li>
              <li>Contact form hookup</li>
              <li>1 revision round</li>
            </ul>
            <div className="mt-6">
              <a
                className="inline-flex items-center justify-center rounded-full px-5 py-2 font-semibold border border-white/15 bg-white/10 hover:bg-white/15"
                href="#contact"
              >
                Choose Starter
              </a>
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold mb-1">Pro</h2>
            <p className="text-3xl font-extrabold mb-4">$799</p>
            <ul className="space-y-2 opacity-90">
              <li>Multi-page site</li>
              <li>Project cards + admin management</li>
              <li>Analytics events wired</li>
              <li>2 revision rounds</li>
            </ul>
            <div className="mt-6">
              <a
                className="inline-flex items-center justify-center rounded-full px-5 py-2 font-semibold border border-white/15 bg-white/10 hover:bg-white/15"
                href="#contact"
              >
                Choose Pro
              </a>
            </div>
          </div>

          {/* Custom */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-3xl font-bold mb-1">Custom Scope</h2>
            <p className="text-4xl font-extrabold mb-4">Let&apos;s talk</p>
            <ul className="space-y-2 opacity-90">
              <li>Blog + SEO</li>
              <li>Supabase migration + storage</li>
              <li>Performance tuning</li>
              <li>Deployment + monitoring</li>
            </ul>
            <div className="mt-6">
              <a
                className="inline-flex items-center justify-center rounded-full px-5 py-2 font-semibold border border-white/15 bg-white/10 hover:bg-white/15"
                href="#contact"
              >
                Contact Me
              </a>
            </div>
          </div>
        </div>

        <div id="contact" className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-2xl font-bold">Contact</h3>
          <p className="mt-2 opacity-80">
            Drop a message and I’ll reply with next steps.
          </p>
        </div>
      </div>
    </div>
  );
}