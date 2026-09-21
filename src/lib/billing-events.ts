import { db } from "@/lib/db";

// Applies the effect of a Paystack transaction/charge/subscription event to
// our Subscription row. Called from two places:
//   1. The settings page, right after Paystack redirects the browser back
//      (fast UI feedback) — via verifyTransaction().
//   2. The webhook route (/api/webhooks/paystack) — the durable,
//      authoritative path, since browser redirects can be interrupted.
// Both paths converge on the functions below, and every one of them is
// safe to call more than once with the same data (idempotent) since
// webhooks can be retried by Paystack.
//
// NOTE ON FIELD SHAPES: these were written against Paystack's public API
// docs, not verified against a live webhook delivery (this environment
// has no Paystack test account). The organizationId/plan lookup via
// `metadata` is the reliable path, since we set that metadata ourselves
// at checkout time and Paystack round-trips it verbatim. The secondary
// lookups (by subscription_code / customer_code, for events that don't
// carry our metadata) are best-effort against the commonly-documented
// payload shape — if your Paystack payloads differ, adjust
// `findSubscriptionForEvent` accordingly. Test with real test-mode
// webhooks before relying on this in production; see README.

type PaystackEventData = {
  status?: string;
  reference?: string;
  metadata?: { organizationId?: string; plan?: string } | null;
  customer?: { customer_code?: string; email?: string } | null;
  plan?: string | { plan_code?: string } | null;
  subscription_code?: string;
  subscription?: { subscription_code?: string } | null;
  email_token?: string;
  next_payment_date?: string;
};

function resolvePlanCode(plan?: PaystackEventData["plan"]): string | undefined {
  if (!plan) return undefined;
  return typeof plan === "string" ? plan : plan.plan_code;
}

async function findSubscriptionForEvent(data: PaystackEventData) {
  const orgId = data.metadata?.organizationId;
  if (orgId) {
    const byOrg = await db.subscription.findUnique({ where: { organizationId: orgId } });
    if (byOrg) return byOrg;
  }

  const subCode = data.subscription_code ?? data.subscription?.subscription_code;
  if (subCode) {
    const bySubCode = await db.subscription.findFirst({ where: { paystackSubscriptionCode: subCode } });
    if (bySubCode) return bySubCode;
  }

  const customerCode = data.customer?.customer_code;
  if (customerCode) {
    const byCustomer = await db.subscription.findFirst({ where: { paystackCustomerCode: customerCode } });
    if (byCustomer) return byCustomer;
  }

  return null;
}

/** `charge.success` webhook event, or the result of a manual verifyTransaction() call. */
export async function applyChargeSuccess(data: PaystackEventData) {
  if (data.status !== "success") return;

  const orgId = data.metadata?.organizationId;
  const plan = data.metadata?.plan;
  if (!orgId || !plan) return; // not one of our checkout transactions

  const subscription = await db.subscription.findUnique({ where: { organizationId: orgId } });
  if (!subscription) return;

  await db.subscription.update({
    where: { organizationId: orgId },
    data: {
      plan,
      status: "ACTIVE",
      paystackCustomerCode: data.customer?.customer_code ?? subscription.paystackCustomerCode,
      paystackPlanCode: resolvePlanCode(data.plan) ?? subscription.paystackPlanCode,
      lastPaystackReference: data.reference ?? subscription.lastPaystackReference,
    },
  });
}

/** `subscription.create` webhook event — fills in the subscription/email token needed to cancel later. */
export async function applySubscriptionCreated(data: PaystackEventData) {
  const subscription = await findSubscriptionForEvent(data);
  if (!subscription) return;

  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      paystackSubscriptionCode: data.subscription_code ?? subscription.paystackSubscriptionCode,
      paystackEmailToken: data.email_token ?? subscription.paystackEmailToken,
      paystackCustomerCode: data.customer?.customer_code ?? subscription.paystackCustomerCode,
      renewsAt: data.next_payment_date ? new Date(data.next_payment_date) : subscription.renewsAt,
    },
  });
}

/** `subscription.disable` / `subscription.not_renew` webhook events. */
export async function applySubscriptionDisabled(data: PaystackEventData) {
  const subscription = await findSubscriptionForEvent(data);
  if (!subscription) return;

  await db.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELED" } });
}

/** `invoice.payment_failed` webhook event — a renewal charge didn't go through. */
export async function applyPaymentFailed(data: PaystackEventData) {
  const subscription = await findSubscriptionForEvent(data);
  if (!subscription) return;

  await db.subscription.update({ where: { id: subscription.id }, data: { status: "PAST_DUE" } });
}
