"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { canSeeMedical } from "@/lib/roles";

async function assertCanSeeMedical(orgId: string) {
  const { user, membership } = await requireOrgMembership(orgId);
  if (!canSeeMedical(membership.role) && membership.role !== "STRENGTH_CONDITIONING") {
    throw new Error("You don't have permission to record this.");
  }
  return user;
}

const scSchema = z.object({
  athleteId: z.string().min(1),
  date: z.string().min(1),
  benchPressKg: z.coerce.number().optional(),
  squatKg: z.coerce.number().optional(),
  sprint10mSec: z.coerce.number().optional(),
  sprint40mSec: z.coerce.number().optional(),
  verticalJumpCm: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export async function addSCEntryAction(orgId: string, formData: FormData) {
  const user = await assertCanSeeMedical(orgId);
  const parsed = scSchema.parse({
    athleteId: formData.get("athleteId"),
    date: formData.get("date"),
    benchPressKg: formData.get("benchPressKg") || undefined,
    squatKg: formData.get("squatKg") || undefined,
    sprint10mSec: formData.get("sprint10mSec") || undefined,
    sprint40mSec: formData.get("sprint40mSec") || undefined,
    verticalJumpCm: formData.get("verticalJumpCm") || undefined,
    notes: formData.get("notes") || undefined,
  });
  await db.strengthConditioningEntry.create({
    data: { organizationId: orgId, createdById: user.id, ...parsed, date: new Date(parsed.date) },
  });
  revalidatePath(`/org/${orgId}/administration/data/strength-conditioning`);
}

export async function deleteSCEntryAction(orgId: string, entryId: string) {
  await assertCanSeeMedical(orgId);
  await db.strengthConditioningEntry.delete({ where: { id: entryId } });
  revalidatePath(`/org/${orgId}/administration/data/strength-conditioning`);
}

const injurySchema = z.object({
  athleteId: z.string().min(1),
  dateInjured: z.string().min(1),
  report: z.string().min(2),
  treatment: z.string().optional(),
  healing: z.string().optional(),
  rehabilitation: z.string().optional(),
  returnToTrainDate: z.string().optional(),
  returnToPlayDate: z.string().optional(),
  status: z.enum(["INJURED", "REHAB", "RETURNED_TO_TRAIN", "RETURNED_TO_PLAY"]),
});

export async function addInjuryAction(orgId: string, formData: FormData) {
  const user = await assertCanSeeMedical(orgId);
  const parsed = injurySchema.parse({
    athleteId: formData.get("athleteId"),
    dateInjured: formData.get("dateInjured"),
    report: formData.get("report"),
    treatment: formData.get("treatment") || undefined,
    healing: formData.get("healing") || undefined,
    rehabilitation: formData.get("rehabilitation") || undefined,
    returnToTrainDate: formData.get("returnToTrainDate") || undefined,
    returnToPlayDate: formData.get("returnToPlayDate") || undefined,
    status: formData.get("status"),
  });
  await db.injury.create({
    data: {
      organizationId: orgId,
      createdById: user.id,
      athleteId: parsed.athleteId,
      dateInjured: new Date(parsed.dateInjured),
      report: parsed.report,
      treatment: parsed.treatment,
      healing: parsed.healing,
      rehabilitation: parsed.rehabilitation,
      returnToTrainDate: parsed.returnToTrainDate ? new Date(parsed.returnToTrainDate) : null,
      returnToPlayDate: parsed.returnToPlayDate ? new Date(parsed.returnToPlayDate) : null,
      status: parsed.status,
    },
  });
  revalidatePath(`/org/${orgId}/administration/data/injuries`);
}

const injuryUpdateSchema = injurySchema.partial({ report: true }).extend({ report: z.string().optional() });

export async function updateInjuryAction(orgId: string, injuryId: string, formData: FormData) {
  await assertCanSeeMedical(orgId);
  const parsed = injuryUpdateSchema.parse({
    athleteId: formData.get("athleteId") || undefined,
    dateInjured: formData.get("dateInjured") || undefined,
    report: formData.get("report") || undefined,
    treatment: formData.get("treatment") || undefined,
    healing: formData.get("healing") || undefined,
    rehabilitation: formData.get("rehabilitation") || undefined,
    returnToTrainDate: formData.get("returnToTrainDate") || undefined,
    returnToPlayDate: formData.get("returnToPlayDate") || undefined,
    status: formData.get("status") || undefined,
  });
  await db.injury.update({
    where: { id: injuryId },
    data: {
      treatment: parsed.treatment,
      healing: parsed.healing,
      rehabilitation: parsed.rehabilitation,
      returnToTrainDate: parsed.returnToTrainDate ? new Date(parsed.returnToTrainDate) : undefined,
      returnToPlayDate: parsed.returnToPlayDate ? new Date(parsed.returnToPlayDate) : undefined,
      status: parsed.status,
    },
  });
  revalidatePath(`/org/${orgId}/administration/data/injuries`);
}
