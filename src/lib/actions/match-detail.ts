"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { canCoach } from "@/lib/roles";

async function assertCanCoach(orgId: string) {
  const { membership } = await requireOrgMembership(orgId);
  if (!canCoach(membership.role)) throw new Error("You don't have permission to edit match reports.");
}

const goalSchema = z.object({
  scorerId: z.string().min(1),
  minute: z.coerce.number().int().min(0).max(150).optional(),
  ownGoal: z.coerce.boolean().optional(),
  notes: z.string().optional(),
});

export async function addGoalAction(orgId: string, fixtureId: string, formData: FormData) {
  await assertCanCoach(orgId);
  const parsed = goalSchema.parse({
    scorerId: formData.get("scorerId"),
    minute: formData.get("minute") || undefined,
    ownGoal: formData.get("ownGoal") === "on",
    notes: formData.get("notes") || undefined,
  });
  await db.matchGoal.create({ data: { fixtureId, ...parsed } });
  revalidatePath(`/org/${orgId}/fixtures/${fixtureId}`);
}

export async function deleteGoalAction(orgId: string, fixtureId: string, goalId: string) {
  await assertCanCoach(orgId);
  await db.matchGoal.delete({ where: { id: goalId } });
  revalidatePath(`/org/${orgId}/fixtures/${fixtureId}`);
}

const cardSchema = z.object({
  playerId: z.string().min(1),
  cardType: z.enum(["YELLOW", "RED"]),
  minute: z.coerce.number().int().min(0).max(150).optional(),
  notes: z.string().optional(),
});

export async function addCardAction(orgId: string, fixtureId: string, formData: FormData) {
  await assertCanCoach(orgId);
  const parsed = cardSchema.parse({
    playerId: formData.get("playerId"),
    cardType: formData.get("cardType"),
    minute: formData.get("minute") || undefined,
    notes: formData.get("notes") || undefined,
  });
  await db.matchCard.create({ data: { fixtureId, ...parsed } });
  revalidatePath(`/org/${orgId}/fixtures/${fixtureId}`);
}

export async function deleteCardAction(orgId: string, fixtureId: string, cardId: string) {
  await assertCanCoach(orgId);
  await db.matchCard.delete({ where: { id: cardId } });
  revalidatePath(`/org/${orgId}/fixtures/${fixtureId}`);
}
