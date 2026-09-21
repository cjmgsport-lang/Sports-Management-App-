"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { canCoach } from "@/lib/roles";
import { MOMENTS } from "@/lib/tactical-periodization";

async function assertCanCoach(orgId: string) {
  const { user, membership } = await requireOrgMembership(orgId);
  if (!canCoach(membership.role)) throw new Error("You don't have permission to edit the game model.");
  return { user, membership };
}

const principleSchema = z.object({
  teamId: z.string().min(1),
  moment: z.enum(MOMENTS as [string, ...string[]]),
  name: z.string().min(2),
  description: z.string().optional(),
});

export async function createPrincipleAction(orgId: string, formData: FormData) {
  await assertCanCoach(orgId);
  const parsed = principleSchema.parse({
    teamId: formData.get("teamId"),
    moment: formData.get("moment"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  const team = await db.team.findFirst({ where: { id: parsed.teamId, organizationId: orgId } });
  if (!team) throw new Error("Team not found in this organization.");

  const count = await db.gamePrinciple.count({ where: { teamId: parsed.teamId, moment: parsed.moment } });
  await db.gamePrinciple.create({
    data: {
      teamId: parsed.teamId,
      moment: parsed.moment,
      name: parsed.name,
      description: parsed.description,
      orderIndex: count,
    },
  });
  revalidatePath(`/org/${orgId}/game-model`);
}

export async function deletePrincipleAction(orgId: string, principleId: string) {
  await assertCanCoach(orgId);
  await db.gamePrinciple.delete({ where: { id: principleId } });
  revalidatePath(`/org/${orgId}/game-model`);
}
