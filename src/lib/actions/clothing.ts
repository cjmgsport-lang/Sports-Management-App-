"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

export async function createClothingItemAction(orgId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      name: z.string().min(2),
      category: z.string().optional(),
      sizesAvailable: z.string().optional(),
      unitPrice: z.coerce.number().min(0),
    })
    .parse({
      name: formData.get("name"),
      category: formData.get("category") || undefined,
      sizesAvailable: formData.get("sizesAvailable") || undefined,
      unitPrice: formData.get("unitPrice") || 0,
    });
  await db.clothingItem.create({ data: { organizationId: orgId, ...parsed } });
  revalidatePath(`/org/${orgId}/clothing`);
}

export async function createClothingOrderAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const parsed = z
    .object({
      teamId: z.string().optional(),
      itemId: z.string().min(1),
      size: z.string().optional(),
      quantity: z.coerce.number().int().min(1),
      athleteName: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse({
      teamId: formData.get("teamId") || undefined,
      itemId: formData.get("itemId"),
      size: formData.get("size") || undefined,
      quantity: formData.get("quantity") || 1,
      athleteName: formData.get("athleteName") || undefined,
      notes: formData.get("notes") || undefined,
    });

  await db.clothingOrder.create({
    data: {
      organizationId: orgId,
      teamId: parsed.teamId || null,
      requestedById: user.id,
      notes: parsed.notes,
      status: "SUBMITTED",
      lines: {
        create: [{ itemId: parsed.itemId, size: parsed.size, quantity: parsed.quantity, athleteName: parsed.athleteName }],
      },
    },
  });
  revalidatePath(`/org/${orgId}/clothing`);
}

export async function updateClothingOrderStatusAction(orgId: string, orderId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const status = z
    .enum(["DRAFT", "SUBMITTED", "CONFIRMED", "FULFILLED", "CANCELED"])
    .parse(formData.get("status"));
  await db.clothingOrder.update({ where: { id: orderId }, data: { status } });
  revalidatePath(`/org/${orgId}/clothing`);
}
