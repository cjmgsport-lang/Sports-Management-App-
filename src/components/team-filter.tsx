"use client";

import { useRouter, usePathname } from "next/navigation";

export function TeamFilter({ teams, current }: { teams: { id: string; name: string }[]; current?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      defaultValue={current ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `${pathname}?teamId=${value}` : pathname);
      }}
      className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
    >
      <option value="">All teams</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
