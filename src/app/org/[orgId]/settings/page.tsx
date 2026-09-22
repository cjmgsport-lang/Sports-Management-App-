import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { switchToFreeAction } from "@/lib/actions/settings";
import { cancelSubscriptionAction, startCheckoutAction } from "@/lib/actions/billing";
import { resetBrandColorAction, updateBrandingAction, updatePublicPageAction } from "@/lib/actions/branding";
import { applyChargeSuccess } from "@/lib/billing-events";
import { PLAN_PRICING, verifyTransaction } from "@/lib/paystack";
import { isAdmin, ORG_TYPE_LABELS, ROLE_LABELS } from "@/lib/roles";
import { format } from "date-fns";

function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

// % saved by paying annually instead of 12x the monthly price, rounded down.
function annualSavingsPct(plan: "GROWTH" | "PRO"): number {
  const { MONTHLY, ANNUAL } = PLAN_PRICING[plan];
  return Math.floor((1 - ANNUAL.amountZarCents / (MONTHLY.amountZarCents * 12)) * 100);
}

const PLANS = [
  { id: "STARTER" as const, name: "Starter", seats: "Up to 50 members" },
  { id: "GROWTH" as const, name: "Growth", seats: "Up to 250 members" },
  { id: "PRO" as const, name: "Pro", seats: "Up to 1,000 members" },
  { id: "ENTERPRISE" as const, name: "Enterprise", seats: "Unlimited members, multi-team federations" },
];

const STATUS_LABELS: Record<string, string> = {
  TRIALING: "Trialing",
  ACTIVE: "Active",
  PAST_DUE: "Payment failed — please update your card",
  CANCELED: "Canceled",
};

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { orgId } = await params;
  const { reference: ref1, trxref } = await searchParams;
  const { membership } = await requireOrgMembership(orgId);

  // If Paystack just redirected back here after checkout, verify the
  // transaction and apply it immediately for fast feedback — the webhook
  // (the durable, authoritative path) does the same thing independently,
  // so this is safe to run every time the page loads with a reference.
  const reference = ref1 ?? trxref;
  let paymentBanner: { ok: boolean; message: string } | null = null;
  if (reference) {
    try {
      const tx = await verifyTransaction(reference);
      if (tx.status === "success") {
        await applyChargeSuccess(tx);
        paymentBanner = { ok: true, message: "Payment received — your plan has been updated." };
      } else {
        paymentBanner = { ok: false, message: `Payment ${tx.status}. If this seems wrong, contact support with reference ${reference}.` };
      }
    } catch (err) {
      console.error("Failed to verify Paystack transaction:", err);
      paymentBanner = { ok: false, message: "We couldn't confirm that payment yet — it may still be processing." };
    }
  }

  const org = await db.organization.findUnique({ where: { id: orgId }, include: { subscription: true } });
  const memberCount = await db.membership.count({ where: { organizationId: orgId } });
  const canManageBilling = isAdmin(membership.role);
  const currentPlan = org?.subscription?.plan ?? "STARTER";
  const canCancel = ["GROWTH", "PRO"].includes(currentPlan) && org?.subscription?.paystackSubscriptionCode;

  return (
    <div>
      <PageHeader title="Settings & Plan" subtitle="Organization details and subscription plan." />

      {paymentBanner && (
        <div className={`mb-6 rounded-lg px-4 py-3 text-sm ${paymentBanner.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {paymentBanner.message}
        </div>
      )}

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

      <Card className="mb-6">
        <CardHeader
          title="Public page"
          subtitle="A public info page for your community — no login needed. Uses your logo and brand color automatically."
        />
        <CardBody>
          <p className="mb-3 text-sm text-slate-600">
            Your page:{" "}
            <a href={`/o/${org?.slug}`} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">
              {process.env.NEXTAUTH_URL ?? ""}/o/{org?.slug}
            </a>
          </p>
          {isAdmin(membership.role) ? (
            <form action={updatePublicPageAction.bind(null, orgId)} className="space-y-3">
              <Field label="Public description (optional)">
                <Textarea
                  name="publicDescription"
                  rows={2}
                  maxLength={500}
                  defaultValue={org?.publicDescription ?? ""}
                  placeholder="A short line about your club or school, shown on the public page."
                />
              </Field>
              <Button type="submit" size="sm">
                Save public page
              </Button>
            </form>
          ) : (
            <p className="text-sm text-slate-400">Only admins can edit the public page.</p>
          )}
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
              {org?.subscription && ` / ${org.subscription.seats} seats`}
              {org?.subscription && memberCount >= org.subscription.seats && (
                <Badge color="red" className="ml-2">
                  Seat limit reached
                </Badge>
              )}
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
                ? `${STATUS_LABELS[org.subscription.status] ?? org.subscription.status}${
                    org.subscription.billingInterval ? ` · billed ${org.subscription.billingInterval === "ANNUAL" ? "annually" : "monthly"}` : ""
                  }${org.subscription.trialEndsAt ? ` · trial ends ${format(org.subscription.trialEndsAt, "d MMM yyyy")}` : ""}${
                    org.subscription.renewsAt ? ` · renews ${format(org.subscription.renewsAt, "d MMM yyyy")}` : ""
                  }`
                : undefined
            }
          />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 ${currentPlan === p.id ? "border-brand-400 bg-brand-50" : "border-slate-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    {currentPlan === p.id && <Badge color="blue">Current</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{p.seats}</p>

                  {p.id === "STARTER" && <p className="mt-1 text-sm font-medium text-slate-700">R0 (30-day trial)</p>}
                  {p.id === "ENTERPRISE" && <p className="mt-1 text-sm font-medium text-slate-700">Custom pricing</p>}
                  {(p.id === "GROWTH" || p.id === "PRO") && (
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatRand(PLAN_PRICING[p.id].MONTHLY.amountZarCents)} / month or{" "}
                      {formatRand(PLAN_PRICING[p.id].ANNUAL.amountZarCents)} / year
                    </p>
                  )}

                  {canManageBilling && currentPlan !== p.id && (
                    <>
                      {p.id === "STARTER" && (
                        <form action={switchToFreeAction.bind(null, orgId)} className="mt-2">
                          <Button type="submit" size="sm" variant="secondary" className="w-full">
                            Switch to Starter
                          </Button>
                        </form>
                      )}
                      {(p.id === "GROWTH" || p.id === "PRO") && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <form action={startCheckoutAction.bind(null, orgId)}>
                            <input type="hidden" name="plan" value={p.id} />
                            <input type="hidden" name="interval" value="MONTHLY" />
                            <Button type="submit" size="sm" variant="secondary" className="w-full">
                              Monthly
                            </Button>
                          </form>
                          <form action={startCheckoutAction.bind(null, orgId)}>
                            <input type="hidden" name="plan" value={p.id} />
                            <input type="hidden" name="interval" value="ANNUAL" />
                            <Button type="submit" size="sm" className="w-full">
                              Annual
                            </Button>
                          </form>
                        </div>
                      )}
                      {(p.id === "GROWTH" || p.id === "PRO") && (
                        <p className="mt-1.5 text-center text-xs font-medium text-emerald-600">
                          Save {annualSavingsPct(p.id)}% paying annually
                        </p>
                      )}
                      {p.id === "ENTERPRISE" && (
                        <a
                          href="mailto:sales@freedomsports.co.za?subject=Enterprise%20plan"
                          className="mt-2 block rounded-lg border border-slate-300 py-1.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Contact sales
                        </a>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {canManageBilling && canCancel && (
              <form action={cancelSubscriptionAction.bind(null, orgId)} className="mt-4 border-t border-slate-100 pt-4">
                <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                  Cancel subscription
                </button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
