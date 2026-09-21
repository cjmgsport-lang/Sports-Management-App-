"use client";

import { useState } from "react";
import { clsx } from "clsx";
import Link from "next/link";
import { AUDIENCE_CONTENT } from "@/lib/audience-content";

export function AudienceTabs() {
  const [activeId, setActiveId] = useState(AUDIENCE_CONTENT[0].id);
  const active = AUDIENCE_CONTENT.find((a) => a.id === activeId) ?? AUDIENCE_CONTENT[0];

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Choose your role">
        {AUDIENCE_CONTENT.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={a.id === activeId}
            onClick={() => setActiveId(a.id)}
            className={clsx(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              a.id === activeId
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700"
            )}
          >
            <span className="mr-1.5">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-10">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-slate-900">{active.tagline}</h3>
          <p className="mx-auto mt-2 max-w-xl text-slate-500">{active.description}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.highlights.map((h) => (
            <div key={h.title} className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="font-semibold text-slate-900">{h.title}</h4>
              <p className="mt-1 text-sm text-slate-500">{h.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <Link
            href={active.primaryCta.href}
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            {active.primaryCta.label}
          </Link>
          <p className="max-w-md text-center text-xs text-slate-400">{active.secondaryNote}</p>
        </div>
      </div>
    </div>
  );
}
