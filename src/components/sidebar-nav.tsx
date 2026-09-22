"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { AreaNav, NavArea } from "@/lib/nav";

const STORAGE_KEY = "fsm-nav-area";

export function SidebarNav({ areas }: { areas: AreaNav[] }) {
  const pathname = usePathname();
  const [area, setArea] = useState<NavArea>("administration");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "administration" || stored === "sport") setArea(stored);
    } catch {
      // Private browsing / blocked storage — default stands.
    }
  }, []);

  function selectArea(next: NavArea) {
    setArea(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal — just won't be remembered next visit.
    }
  }

  const current = areas.find((a) => a.area === area) ?? areas[0];

  return (
    <>
      <div className="grid grid-cols-2 gap-1 px-3 pt-3">
        {areas.map((a) => (
          <button
            key={a.area}
            type="button"
            onClick={() => selectArea(a.area)}
            className={clsx(
              "rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
              a.area === area ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            {a.areaLabel}
          </button>
        ))}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {current.groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
            <div className="mt-1 space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}
