"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { isAdmin } from "@/lib/roles";
import { disableSubscription } from "@/lib/paystack";

/** Downgrades to the free Starter plan — cancels any live Paystack subscription first. */
export async function switchToFreeAction(orgId: string) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can change the subscription plan.");

  const subscription = await db.subscription.findUnique({ where: { organizationId: orgId } });
  if (subscription?.paystackSubscriptionCode && subscription.paystackEmailToken) {
    try {
      await disableSubscription(subscription.paystackSubscriptionCode, subscription.paystackEmailToken);
    } catch (err) {
      console.error("Failed to disable Paystack subscription:", err);
    }
  }

  await db.subscription.update({
    where: { organizationId: orgId },
    data: { plan: "STARTER", status: "ACTIVE", paystackSubscriptionCode: null, paystackEmailToken: null },
  });
  revalidatePath(`/org/${orgId}/settings`);
}
