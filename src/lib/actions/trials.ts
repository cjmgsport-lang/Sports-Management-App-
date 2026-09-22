"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { TRIAL_CRITERIA } from "@/lib/trial-criteria";

export async function createTrialEventAction(orgId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      teamId: z.string().optional(),
      name: z.string().min(2),
      date: z.string().min(1),
      venue: z.string().optional(),
      ageGroup: z.string().optional(),
      description: z.string().optional(),
    })
    .parse({
      teamId: formData.get("teamId") || undefined,
      name: formData.get("name"),
      date: formData.get("date"),
      venue: formData.get("venue") || undefined,
      ageGroup: formData.get("ageGroup") || undefined,
      description: formData.get("description") || undefined,
    });

  await db.trialEvent.create({
    data: {
      organizationId: orgId,
      teamId: parsed.teamId || null,
      name: parsed.name,
      date: new Date(parsed.date),
      venue: parsed.venue,
      ageGroup: parsed.ageGroup,
      description: parsed.description,
    },
  });
  revalidatePath(`/org/${orgId}/trials`);
}

export async function addTrialistAction(orgId: string, trialEventId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const athleteId = z.string().min(1).parse(formData.get("athleteId"));
  await db.trialSelectionDocument.upsert({
    where: { trialEventId_athleteId: { trialEventId, athleteId } },
    update: {},
    create: { trialEventId, athleteId },
  });
  revalidatePath(`/org/${orgId}/trials`);
}

export async function decideSelectionAction(orgId: string, selectionId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const parsed = z
    .object({
      status: z.enum(["PENDING", "SELECTED", "RESERVE", "NOT_SELECTED"]),
      notes: z.string().optional(),
    })
    .parse({
      status: formData.get("status"),
      notes: formData.get("notes") || undefined,
    });

  await db.trialSelectionDocument.update({
    where: { id: selectionId },
    data: { status: parsed.status, notes: parsed.notes, decidedById: user.id, decidedAt: new Date() },
  });
  revalidatePath(`/org/${orgId}/trials`);
}

const scoreShape = Object.fromEntries(TRIAL_CRITERIA.map((c) => [c, z.coerce.number().int().min(1).max(5).optional()]));
const scoreSchema = z.object(scoreShape);

/** Scores an athlete's trial across the nine selection domains (1-5 each) — Administration > Trials & Selection. */
export async function scoreTrialCriteriaAction(orgId: string, selectionId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const data: Record<string, number | undefined> = {};
  for (const c of TRIAL_CRITERIA) {
    const raw = formData.get(c);
    data[c] = raw ? Number(raw) : undefined;
  }
  const parsed = scoreSchema.parse(data);

  await db.trialSelectionDocument.update({ where: { id: selectionId }, data: parsed });
  revalidatePath(`/org/${orgId}/trials`);
}
