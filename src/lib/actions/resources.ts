"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

export async function createResourceAction(orgId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      name: z.string().min(2),
      category: z.enum(["FIELD", "BALLS", "CONES", "POLES", "MANNEQUINS", "GPS_UNIT", "VIDEO_EQUIPMENT", "OTHER"]),
      quantityTotal: z.coerce.number().int().min(1),
      notes: z.string().optional(),
    })
    .parse({
      name: formData.get("name"),
      category: formData.get("category"),
      quantityTotal: formData.get("quantityTotal") || 1,
      notes: formData.get("notes") || undefined,
    });
  await db.resource.create({ data: { organizationId: orgId, ...parsed } });
  revalidatePath(`/org/${orgId}/resources`);
}

export async function createBookingAction(orgId: string, resourceId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const parsed = z
    .object({
      teamId: z.string().optional(),
      startsAt: z.string().min(1),
      endsAt: z.string().min(1),
      quantity: z.coerce.number().int().min(1),
      purpose: z.string().optional(),
    })
    .parse({
      teamId: formData.get("teamId") || undefined,
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
      quantity: formData.get("quantity") || 1,
      purpose: formData.get("purpose") || undefined,
    });

  await db.resourceBooking.create({
    data: {
      resourceId,
      teamId: parsed.teamId || null,
      requestedById: user.id,
      startsAt: new Date(parsed.startsAt),
      endsAt: new Date(parsed.endsAt),
      quantity: parsed.quantity,
      purpose: parsed.purpose,
      status: "REQUESTED",
    },
  });
  revalidatePath(`/org/${orgId}/resources`);
}

export async function updateBookingStatusAction(orgId: string, bookingId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const status = z.enum(["REQUESTED", "APPROVED", "REJECTED", "CANCELED"]).parse(formData.get("status"));
  await db.resourceBooking.update({ where: { id: bookingId }, data: { status } });
  revalidatePath(`/org/${orgId}/resources`);
}
