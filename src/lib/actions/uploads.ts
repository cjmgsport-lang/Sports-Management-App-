"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { saveUploadedFile } from "@/lib/storage";

const metaSchema = z.object({
  kind: z.enum(["GPS", "VIDEO", "SESSION_ANIMATION", "PDF", "IMAGE", "OTHER"]),
  description: z.string().optional(),
  linkedFixtureId: z.string().optional(),
  linkedSessionId: z.string().optional(),
  linkedAthleteId: z.string().optional(),
});

export async function uploadAssetAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose a file to upload.");
  }

  const parsed = metaSchema.parse({
    kind: formData.get("kind"),
    description: formData.get("description") || undefined,
    linkedFixtureId: formData.get("linkedFixtureId") || undefined,
    linkedSessionId: formData.get("linkedSessionId") || undefined,
    linkedAthleteId: formData.get("linkedAthleteId") || undefined,
  });

  const { storedPath, sizeBytes } = await saveUploadedFile(orgId, file);

  await db.uploadAsset.create({
    data: {
      organizationId: orgId,
      kind: parsed.kind,
      filename: file.name,
      storedPath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes,
      description: parsed.description,
      uploadedById: user.id,
      linkedFixtureId: parsed.linkedFixtureId || null,
      linkedSessionId: parsed.linkedSessionId || null,
      linkedAthleteId: parsed.linkedAthleteId || null,
    },
  });

  revalidatePath(`/org/${orgId}/uploads`);
}

export async function deleteUploadAction(orgId: string, uploadId: string) {
  await requireOrgMembership(orgId);
  await db.uploadAsset.delete({ where: { id: uploadId } });
  revalidatePath(`/org/${orgId}/uploads`);
}
