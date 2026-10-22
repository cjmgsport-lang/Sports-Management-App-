"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { resolveUploadedFile } from "@/lib/storage";
import { describeExternalUrl, parseExternalUrl } from "@/lib/external-links";

const metaSchema = z.object({
  kind: z.enum(["GPS", "VIDEO", "SESSION_ANIMATION", "PDF", "IMAGE", "OTHER"]),
  description: z.string().optional(),
  linkedFixtureId: z.string().optional(),
  linkedSessionId: z.string().optional(),
  linkedAthleteId: z.string().optional(),
  linkedFeedbackId: z.string().optional(),
  folder: z.string().optional(),
});

export async function uploadAssetAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);

  const externalUrl = parseExternalUrl(formData.get("externalUrl"));
  const file = await resolveUploadedFile(orgId, formData, "file");
  if (!file && !externalUrl) throw new Error("Please choose a file to upload or paste a link.");

  const parsed = metaSchema.parse({
    kind: formData.get("kind"),
    description: formData.get("description") || undefined,
    linkedFixtureId: formData.get("linkedFixtureId") || undefined,
    linkedSessionId: formData.get("linkedSessionId") || undefined,
    linkedAthleteId: formData.get("linkedAthleteId") || undefined,
    linkedFeedbackId: formData.get("linkedFeedbackId") || undefined,
    folder: formData.get("folder") || undefined,
  });

  await db.uploadAsset.create({
    data: {
      organizationId: orgId,
      kind: parsed.kind,
      ...(file
        ? { filename: file.filename, storedPath: file.storedPath, mimeType: file.mimeType, sizeBytes: file.sizeBytes }
        : { filename: describeExternalUrl(externalUrl!), storedPath: "", mimeType: "text/uri-list", sizeBytes: 0, externalUrl }),
      description: parsed.description,
      uploadedById: user.id,
      linkedFixtureId: parsed.linkedFixtureId || null,
      linkedSessionId: parsed.linkedSessionId || null,
      linkedAthleteId: parsed.linkedAthleteId || null,
      linkedFeedbackId: parsed.linkedFeedbackId || null,
      folder: parsed.folder || null,
    },
  });

  revalidatePath(`/org/${orgId}/uploads`);
  revalidatePath(`/org/${orgId}/administration/data/training-folders`);
  revalidatePath(`/org/${orgId}/feedback`);
}

export async function deleteUploadAction(orgId: string, uploadId: string) {
  await requireOrgMembership(orgId);
  await db.uploadAsset.delete({ where: { id: uploadId } });
  revalidatePath(`/org/${orgId}/uploads`);
}
