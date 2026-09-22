"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { canCoach } from "@/lib/roles";
import { saveUploadedFile } from "@/lib/storage";
import { TRAINING_CATEGORIES, TRAINING_RESOURCE_KINDS, type TrainingCategory, type TrainingResourceKind } from "@/lib/training-categories";

const metaSchema = z.object({
  teamId: z.string().optional(),
  category: z.enum([...TRAINING_CATEGORIES] as [TrainingCategory, ...TrainingCategory[]]),
  kind: z.enum([...TRAINING_RESOURCE_KINDS] as [TrainingResourceKind, ...TrainingResourceKind[]]),
  title: z.string().min(2),
  description: z.string().optional(),
});

export async function uploadTrainingResourceAction(orgId: string, formData: FormData) {
  const { user, membership } = await requireOrgMembership(orgId);
  if (!canCoach(membership.role)) throw new Error("You don't have permission to upload training content.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Please choose a file to upload.");

  const parsed = metaSchema.parse({
    teamId: formData.get("teamId") || undefined,
    category: formData.get("category"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  const { storedPath } = await saveUploadedFile(orgId, file);

  await db.trainingResource.create({
    data: {
      organizationId: orgId,
      teamId: parsed.teamId || null,
      category: parsed.category,
      kind: parsed.kind,
      title: parsed.title,
      description: parsed.description,
      storedPath,
      mimeType: file.type || "application/octet-stream",
      uploadedById: user.id,
    },
  });
  revalidatePath(`/org/${orgId}/sport/training`);
}

export async function deleteTrainingResourceAction(orgId: string, resourceId: string) {
  const { membership } = await requireOrgMembership(orgId);
  if (!canCoach(membership.role)) throw new Error("You don't have permission to delete training content.");
  await db.trainingResource.delete({ where: { id: resourceId } });
  revalidatePath(`/org/${orgId}/sport/training`);
}
