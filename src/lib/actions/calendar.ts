"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

const eventSchema = z.object({
  teamId: z.string().min(1),
  title: z.string().min(2),
  type: z.enum(["TRAINING", "MATCH", "MEETING", "TRAVEL", "TOURNAMENT", "OTHER"]),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
});

export async function createEventAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);

  const parsed = eventSchema.parse({
    teamId: formData.get("teamId"),
    title: formData.get("title"),
    type: formData.get("type"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location") || undefined,
    description: formData.get("description") || undefined,
  });

  const team = await db.team.findFirst({ where: { id: parsed.teamId, organizationId: orgId } });
  if (!team) throw new Error("Team not found in this organization.");

  await db.calendarEvent.create({
    data: {
      teamId: parsed.teamId,
      title: parsed.title,
      type: parsed.type,
      startsAt: new Date(parsed.startsAt),
      endsAt: new Date(parsed.endsAt),
      location: parsed.location,
      description: parsed.description,
      createdById: user.id,
    },
  });

  revalidatePath(`/org/${orgId}/calendar`);
}

export async function deleteEventAction(orgId: string, eventId: string) {
  await requireOrgMembership(orgId);
  await db.calendarEvent.delete({ where: { id: eventId } });
  revalidatePath(`/org/${orgId}/calendar`);
}
