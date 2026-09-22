"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { canCoach } from "@/lib/roles";

const recruitmentSchema = z.object({
  teamId: z.string().optional(),
  name: z.string().min(1),
  surname: z.string().min(1),
  dateOfBirth: z.string().optional(),
  startYear: z.coerce.number().int().optional(),
  endYear: z.coerce.number().int().optional(),
  positionRole: z.string().optional(),
  bursaryCost: z.string().optional(),
  dualCareer: z.string().optional(),
  notes: z.string().optional(),
});

export async function addRecruitmentRecordAction(orgId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!canCoach(membership.role)) throw new Error("You don't have permission to edit recruitment records.");

  const parsed = recruitmentSchema.parse({
    teamId: formData.get("teamId") || undefined,
    name: formData.get("name"),
    surname: formData.get("surname"),
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    startYear: formData.get("startYear") || undefined,
    endYear: formData.get("endYear") || undefined,
    positionRole: formData.get("positionRole") || undefined,
    bursaryCost: formData.get("bursaryCost") || undefined,
    dualCareer: formData.get("dualCareer") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await db.recruitmentRecord.create({
    data: {
      organizationId: orgId,
      teamId: parsed.teamId || null,
      name: parsed.name,
      surname: parsed.surname,
      dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
      startYear: parsed.startYear,
      endYear: parsed.endYear,
      positionRole: parsed.positionRole,
      bursaryCost: parsed.bursaryCost,
      dualCareer: parsed.dualCareer,
      notes: parsed.notes,
    },
  });
  revalidatePath(`/org/${orgId}/sport/recruitment`);
}

export async function deleteRecruitmentRecordAction(orgId: string, recordId: string) {
  const { membership } = await requireOrgMembership(orgId);
  if (!canCoach(membership.role)) throw new Error("You don't have permission to edit recruitment records.");
  await db.recruitmentRecord.delete({ where: { id: recordId } });
  revalidatePath(`/org/${orgId}/sport/recruitment`);
}
