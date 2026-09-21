"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { isAdmin } from "@/lib/roles";

export async function updatePlanAction(orgId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can change the subscription plan.");

  const plan = z.enum(["STARTER", "GROWTH", "PRO", "ENTERPRISE"]).parse(formData.get("plan"));
  await db.subscription.update({ where: { organizationId: orgId }, data: { plan, status: "ACTIVE" } });
  revalidatePath(`/org/${orgId}/settings`);
}
