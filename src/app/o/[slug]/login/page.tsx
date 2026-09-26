import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui";
import { LoginForm } from "@/app/login/login-form";
import { BRAND_SHADE_KEYS, HEX_COLOR_PATTERN, generateBrandShades } from "@/lib/color";

export default async function OrgLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ registered?: string }>;
}) {
  const { slug } = await params;
  const { registered } = await searchParams;

  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) notFound();

  const brandOverride = org.brandColor && HEX_COLOR_PATTERN.test(org.brandColor) ? generateBrandShades(org.brandColor) : null;
  const logoSrc = org.logoPath ? `/api/public-logo/${org.id}` : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-700 px-4 py-10">
      {brandOverride && (
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{${BRAND_SHADE_KEYS.map((shade) => `--brand-${shade}:${brandOverride[shade]};`).join("")}}`,
          }}
        />
      )}

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={`${org.name} logo`} className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-white object-contain p-1.5 shadow" />
          ) : (
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-brand-700 shadow">
              {org.name.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-semibold text-white">{org.name}</h1>
          <p className="mt-1 text-sm text-brand-100">Log in to your workspace.</p>
        </div>

        <Card>
          <CardBody>
            {registered && (
              <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Account created. Log in to continue.</div>
            )}
            <LoginForm />
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-sm text-brand-100">
          Not with {org.name}?{" "}
          <Link href="/login" className="font-medium text-white hover:underline">
            Log in to a different organization
          </Link>
        </p>
      </div>
    </main>
  );
}
