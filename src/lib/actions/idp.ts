"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

export async function createIdpAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const parsed = z
    .object({
      athleteId: z.string().min(1),
      teamId: z.string().optional(),
      seasonName: z.string().optional(),
      goals: z.string().min(2),
      strengths: z.string().optional(),
      areasForImprovement: z.string().optional(),
      actionPlan: z.string().optional(),
      reviewDate: z.string().optional(),
    })
    .parse({
      athleteId: formData.get("athleteId"),
      teamId: formData.get("teamId") || undefined,
      seasonName: formData.get("seasonName") || undefined,
      goals: formData.get("goals"),
      strengths: formData.get("strengths") || undefined,
      areasForImprovement: formData.get("areasForImprovement") || undefined,
      actionPlan: formData.get("actionPlan") || undefined,
      reviewDate: formData.get("reviewDate") || undefined,
    });

  await db.individualDevelopmentPlan.create({
    data: {
      organizationId: orgId,
      athleteId: parsed.athleteId,
      teamId: parsed.teamId || null,
      seasonName: parsed.seasonName,
      goals: parsed.goals,
      strengths: parsed.strengths,
      areasForImprovement: parsed.areasForImprovement,
      actionPlan: parsed.actionPlan,
      reviewDate: parsed.reviewDate ? new Date(parsed.reviewDate) : null,
      createdById: user.id,
    },
  });
  revalidatePath(`/org/${orgId}/idp`);
}
