"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { canCoach } from "@/lib/roles";
import { saveUploadedFile } from "@/lib/storage";
import { GAME_CONTINUUM_MOMENTS, type GameContinuumMomentId } from "@/lib/game-continuum";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const momentSchema = z.object({
  moment: z.enum([...GAME_CONTINUUM_MOMENTS] as [GameContinuumMomentId, ...GameContinuumMomentId[]]),
  description: z.string().optional(),
});

/** Upserts one game-continuum moment's description and/or field-space image for a team. */
export async function updateGameContinuumMomentAction(orgId: string, teamId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!canCoach(membership.role)) throw new Error("You don't have permission to edit the game continuum.");

  const team = await db.team.findFirst({ where: { id: teamId, organizationId: orgId } });
  if (!team) throw new Error("Team not found in this organization.");

  const parsed = momentSchema.parse({
    moment: formData.get("moment"),
    description: formData.get("description") || undefined,
  });

  const data: { description?: string; imagePath?: string; imageMimeType?: string } = {};
  if (parsed.description !== undefined) data.description = parsed.description;

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Image must be a PNG, JPEG, WebP or SVG.");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be smaller than 4MB.");
    const { storedPath } = await saveUploadedFile(orgId, file);
    data.imagePath = storedPath;
    data.imageMimeType = file.type;
  }

  await db.gameContinuumMoment.upsert({
    where: { teamId_moment: { teamId, moment: parsed.moment } },
    update: data,
    create: { teamId, moment: parsed.moment, ...data },
  });
  revalidatePath(`/org/${orgId}/sport/game-continuum`);
}
