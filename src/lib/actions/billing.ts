"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { isAdmin } from "@/lib/roles";
import {
  disableSubscription,
  getPaystackPlanCode,
  initializeTransaction,
  PLAN_PRICING,
  type BillablePlan,
  type BillingInterval,
} from "@/lib/paystack";
import { revalidatePath } from "next/cache";

/** Starts a Paystack Standard Checkout for an upgrade to GROWTH or PRO, at a chosen billing interval. Redirects the browser to Paystack. */
export async function startCheckoutAction(orgId: string, formData: FormData) {
  const { user, membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can change the subscription plan.");

  const plan = z.enum(["GROWTH", "PRO"]).parse(formData.get("plan")) as BillablePlan;
  const interval = z.enum(["MONTHLY", "ANNUAL"]).parse(formData.get("interval")) as BillingInterval;
  const pricing = PLAN_PRICING[plan][interval];
  const planCode = getPaystackPlanCode(plan, interval);
  if (!planCode) {
    throw new Error(`Paystack plan code for ${plan} (${interval}) is not configured (set ${pricing.planCodeEnvVar}). See README for setup.`);
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const { authorization_url } = await initializeTransaction({
    email: user.email,
    amountZarCents: pricing.amountZarCents,
    planCode,
    callbackUrl: `${baseUrl}/org/${orgId}/settings`,
    metadata: { organizationId: orgId, plan, interval },
  });

  redirect(authorization_url);
}

export async function cancelSubscriptionAction(orgId: string) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can change the subscription plan.");

  const subscription = await db.subscription.findUnique({ where: { organizationId: orgId } });
  if (!subscription?.paystackSubscriptionCode || !subscription.paystackEmailToken) {
    throw new Error("No active Paystack subscription to cancel.");
  }

  await disableSubscription(subscription.paystackSubscriptionCode, subscription.paystackEmailToken);
  await db.subscription.update({
    where: { organizationId: orgId },
    data: { status: "CANCELED" },
  });
  revalidatePath(`/org/${orgId}/settings`);
}
