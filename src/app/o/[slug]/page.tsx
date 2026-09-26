import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ORG_TYPE_LABELS } from "@/lib/roles";
import { BRAND_SHADE_KEYS, HEX_COLOR_PATTERN, generateBrandShades } from "@/lib/color";

export default async function PublicOrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const brandOverride = org.brandColor && HEX_COLOR_PATTERN.test(org.brandColor) ? generateBrandShades(org.brandColor) : null;
  const logoSrc = org.logoPath ? `/api/public-logo/${org.id}` : null;

  return (
    <main className="min-h-screen bg-white">
      {brandOverride && (
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{${BRAND_SHADE_KEYS.map((shade) => `--brand-${shade}:${brandOverride[shade]};`).join("")}}`,
          }}
        />
      )}

      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <span className="text-sm font-medium text-slate-400">Powered by Freedom Sports Management</span>
          <Link href={`/o/${slug}/login`} className="text-sm font-medium text-brand-700 hover:underline">
            Log in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        {logoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} alt={`${org.name} logo`} className="mx-auto mb-6 h-24 w-24 rounded-2xl object-contain" />
        )}
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{ORG_TYPE_LABELS[org.type] ?? org.type}</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{org.name}</h1>
        {org.city && <p className="mt-2 text-slate-500">{org.city}</p>}
        {org.publicDescription && <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">{org.publicDescription}</p>}

        <div className="mt-8">
          <Link
            href={`/o/${slug}/login`}
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Member login
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Coach, parent or player at {org.name}? Ask your club or school for an invite if you don't have an account yet.
        </p>
      </section>

      <footer className="border-t border-slate-100 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} {org.name}
      </footer>
    </main>
  );
}
