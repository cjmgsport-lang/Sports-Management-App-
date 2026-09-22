import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgMembership } from "@/lib/current-user";
import { buildAreaNav } from "@/lib/nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ORG_TYPE_LABELS, ROLE_LABELS } from "@/lib/roles";
import { BRAND_SHADE_KEYS, HEX_COLOR_PATTERN, generateBrandShades } from "@/lib/color";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { user, membership } = await requireOrgMembership(orgId);
  const org = membership.organization;
  if (!org) notFound();

  const areas = buildAreaNav(orgId);
  const brandOverride = org.brandColor && HEX_COLOR_PATTERN.test(org.brandColor) ? generateBrandShades(org.brandColor) : null;
  const logoSrc = org.logoPath ? `/api/org-logo/${orgId}?v=${encodeURIComponent(org.logoPath)}` : null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {brandOverride && (
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{${BRAND_SHADE_KEYS.map((shade) => `--brand-${shade}:${brandOverride[shade]};`).join("")}}`,
          }}
        />
      )}
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-4">
          <Link href="/" className="text-sm font-bold text-brand-700">
            Freedom Sports Management
          </Link>
          <div className="mt-2 flex items-center gap-2">
            {logoSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt={`${org.name} logo`} className="h-8 w-8 rounded object-contain" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{org.name}</p>
              <p className="text-xs text-slate-400">{ORG_TYPE_LABELS[org.type]}</p>
            </div>
          </div>
        </div>
        <SidebarNav areas={areas} />
        <div className="border-t border-slate-100 px-4 py-3">
          <Link href="/select-organization" className="text-xs font-medium text-brand-600 hover:underline">
            Switch organization
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div />
          <div className="flex items-center gap-4">
            <Link href="/account" className="text-right hover:opacity-75">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[membership.role]}</p>
            </Link>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
