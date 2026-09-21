"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

export async function createFeedbackAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const teamAthlete = z.string().min(1).parse(formData.get("teamAthlete"));
  const [teamId, athleteId] = teamAthlete.split(":");

  const parsed = z
    .object({
      weekStarting: z.string().min(1),
      performanceRating: z.coerce.number().int().min(1).max(5),
      strengths: z.string().optional(),
      areasToImprove: z.string().optional(),
    })
    .parse({
      weekStarting: formData.get("weekStarting"),
      performanceRating: formData.get("performanceRating"),
      strengths: formData.get("strengths") || undefined,
      areasToImprove: formData.get("areasToImprove") || undefined,
    });

  await db.weeklyFeedback.create({
    data: {
      teamId,
      athleteId,
      coachId: user.id,
      weekStarting: new Date(parsed.weekStarting),
      performanceRating: parsed.performanceRating,
      strengths: parsed.strengths,
      areasToImprove: parsed.areasToImprove,
    },
  });
  revalidatePath(`/org/${orgId}/feedback`);
}

export async function addAthleteCommentAction(orgId: string, feedbackId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const comment = z.string().min(1).parse(formData.get("athleteComment"));
  await db.weeklyFeedback.update({ where: { id: feedbackId }, data: { athleteComment: comment } });
  revalidatePath(`/org/${orgId}/feedback`);
}
