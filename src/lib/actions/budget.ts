"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

export async function createBudgetAction(orgId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      userId: z.string().min(1),
      seasonName: z.string().min(2),
      totalBudget: z.coerce.number().min(0),
    })
    .parse({
      userId: formData.get("userId"),
      seasonName: formData.get("seasonName"),
      totalBudget: formData.get("totalBudget") || 0,
    });
  await db.seasonBudget.create({ data: { organizationId: orgId, ...parsed } });
  revalidatePath(`/org/${orgId}/budget`);
}

export async function addBudgetLineAction(orgId: string, budgetId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      category: z.string().min(1),
      description: z.string().optional(),
      amount: z.coerce.number(),
      dueDate: z.string().optional(),
    })
    .parse({
      category: formData.get("category"),
      description: formData.get("description") || undefined,
      amount: formData.get("amount"),
      dueDate: formData.get("dueDate") || undefined,
    });

  await db.budgetLineItem.create({
    data: {
      budgetId,
      category: parsed.category,
      description: parsed.description,
      amount: parsed.amount,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    },
  });
  revalidatePath(`/org/${orgId}/budget`);
}

export async function toggleBudgetLinePaidAction(orgId: string, lineId: string, paid: boolean) {
  await requireOrgMembership(orgId);
  await db.budgetLineItem.update({ where: { id: lineId }, data: { paid } });
  revalidatePath(`/org/${orgId}/budget`);
}
