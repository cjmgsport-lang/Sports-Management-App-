"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { isAdmin } from "@/lib/roles";
import { saveUploadedFile } from "@/lib/storage";
import { HEX_COLOR_PATTERN } from "@/lib/color";

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function updateBrandingAction(orgId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) {
    throw new Error("Only admins can update organization branding.");
  }

  const brandColorRaw = formData.get("brandColor");
  const brandColor =
    typeof brandColorRaw === "string" && brandColorRaw.trim() ? brandColorRaw.trim() : undefined;
  if (brandColor) {
    z.string().regex(HEX_COLOR_PATTERN, "Brand color must be a hex value like #1a6ef2").parse(brandColor);
  }

  const file = formData.get("logo");
  const data: { brandColor?: string; logoPath?: string; logoMimeType?: string } = {};
  if (brandColor) data.brandColor = brandColor;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      throw new Error("Logo must be a PNG, JPEG, WebP or SVG image.");
    }
    if (file.size > MAX_LOGO_BYTES) {
      throw new Error("Logo must be smaller than 2MB.");
    }
    const { storedPath } = await saveUploadedFile(orgId, file);
    data.logoPath = storedPath;
    data.logoMimeType = file.type;
  }

  if (Object.keys(data).length === 0) return;

  await db.organization.update({ where: { id: orgId }, data });
  revalidatePath(`/org/${orgId}`, "layout");
}

export async function resetBrandColorAction(orgId: string) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) {
    throw new Error("Only admins can update organization branding.");
  }
  await db.organization.update({ where: { id: orgId }, data: { brandColor: null } });
  revalidatePath(`/org/${orgId}`, "layout");
}

/** Updates the short public-facing description shown on the org's public page (/o/[slug]). */
export async function updatePublicPageAction(orgId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) {
    throw new Error("Only admins can update the public page.");
  }

  const publicDescription = z.string().max(500).optional().parse(formData.get("publicDescription") || undefined);
  await db.organization.update({ where: { id: orgId }, data: { publicDescription: publicDescription ?? null } });
  revalidatePath(`/org/${orgId}/settings`);
}
