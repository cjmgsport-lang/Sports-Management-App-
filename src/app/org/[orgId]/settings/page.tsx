import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader } from "@/components/ui";
import { updatePlanAction } from "@/lib/actions/settings";
import { resetBrandColorAction, updateBrandingAction } from "@/lib/actions/branding";
import { isAdmin, ORG_TYPE_LABELS, ROLE_LABELS } from "@/lib/roles";
import { format } from "date-fns";

const PLANS = [
  { id: "STARTER", name: "Starter", seats: "Up to 50 members", price: "R0 (30-day trial)" },
  { id: "GROWTH", name: "Growth", seats: "Up to 250 members", price: "R2,499 / month" },
  { id: "PRO", name: "Pro", seats: "Up to 1,000 members", price: "R5,999 / month" },
  { id: "ENTERPRISE", name: "Enterprise", seats: "Unlimited members, multi-team federations", price: "Custom pricing" },
];

export default async function SettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const org = await db.organization.findUnique({ where: { id: orgId }, include: { subscription: true } });
  const memberCount = await db.membership.count({ where: { organizationId: orgId } });

  return (
    <div>
      <PageHeader title="Settings & Plan" subtitle="Organization details and subscription plan." />

      <Card className="mb-6">
        <CardHeader title="Branding" subtitle="Upload your logo and pick a brand color — it's applied across the whole workspace." />
        <CardBody>
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex items-center gap-3">
              {org?.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/org-logo/${orgId}?v=${encodeURIComponent(org.logoPath)}`}
                  alt={`${org.name} logo`}
                  className="h-16 w-16 rounded-lg border border-slate-200 object-contain"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                  No logo
                </div>
              )}
              <div className="h-10 w-10 rounded-lg border border-slate-200" style={{ backgroundColor: org?.brandColor ?? "#0284c7" }} />
            </div>

            {isAdmin(membership.role) ? (
              <form action={updateBrandingAction.bind(null, orgId)} className="flex flex-1 flex-wrap items-end gap-4">
                <Field label="Logo (PNG, JPEG, WebP or SVG, max 2MB)">
                  <Input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="w-64" />
                </Field>
                <Field label="Brand color">
                  <input type="color" name="brandColor" defaultValue={org?.brandColor ?? "#0284c7"} className="h-10 w-16 rounded border border-slate-300" />
                </Field>
                <Button type="submit">Save branding</Button>
              </form>
            ) : (
              <p className="text-sm text-slate-400">Only admins can update branding.</p>
            )}

            {isAdmin(membership.role) && org?.brandColor && (
              <form action={resetBrandColorAction.bind(null, orgId)}>
                <button type="submit" className="text-xs font-medium text-slate-400 hover:text-slate-600 hover:underline">
                  Reset to default color
                </button>
              </form>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Organization" />
          <CardBody className="space-y-1.5 text-sm">
            <p>
              <span className="font-medium text-slate-700">Name: </span>
              {org?.name}
            </p>
            <p>
              <span className="font-medium text-slate-700">Type: </span>
              {org && ORG_TYPE_LABELS[org.type]}
            </p>
            <p>
              <span className="font-medium text-slate-700">City: </span>
              {org?.city ?? "—"}
            </p>
            <p>
              <span className="font-medium text-slate-700">Members: </span>
              {memberCount}
            </p>
            <p>
              <span className="font-medium text-slate-700">Your role: </span>
              {ROLE_LABELS[membership.role]}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Subscription"
            subtitle={
              org?.subscription
                ? `${org.subscription.status}${org.subscription.trialEndsAt ? ` · trial ends ${format(org.subscription.trialEndsAt, "d MMM yyyy")}` : ""}`
                : undefined
            }
          />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 ${org?.subscription?.plan === p.id ? "border-brand-400 bg-brand-50" : "border-slate-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    {org?.subscription?.plan === p.id && <Badge color="blue">Current</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{p.seats}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{p.price}</p>
                  {isAdmin(membership.role) && org?.subscription?.plan !== p.id && (
                    <form action={updatePlanAction.bind(null, orgId)} className="mt-2">
                      <input type="hidden" name="plan" value={p.id} />
                      <Button type="submit" size="sm" variant="secondary" className="w-full">
                        Switch to {p.name}
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
