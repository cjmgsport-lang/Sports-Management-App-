"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

async function assertCanCoach(orgId: string) {
  const { user, membership } = await requireOrgMembership(orgId);
  const allowed = ["OWNER", "ADMIN", "COACH", "ASSISTANT_COACH", "MANAGER"];
  if (!allowed.includes(membership.role)) throw new Error("You don't have permission to edit training plans.");
  return { user, membership };
}

const seasonSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(2),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function createSeasonAction(orgId: string, formData: FormData) {
  await assertCanCoach(orgId);
  const parsed = seasonSchema.parse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  await db.season.create({
    data: {
      organizationId: orgId,
      teamId: parsed.teamId,
      name: parsed.name,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    },
  });
  revalidatePath(`/org/${orgId}/training-plans`);
}

const macroSchema = z.object({
  seasonId: z.string().min(1),
  name: z.string().min(2),
  focus: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function createMacrocycleAction(orgId: string, seasonId: string, formData: FormData) {
  await assertCanCoach(orgId);
  const parsed = macroSchema.parse({
    seasonId,
    name: formData.get("name"),
    focus: formData.get("focus") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  await db.macrocycle.create({
    data: {
      seasonId,
      name: parsed.name,
      focus: parsed.focus,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    },
  });
  revalidatePath(`/org/${orgId}/training-plans/${seasonId}`);
}

const mesoSchema = z.object({
  name: z.string().min(2),
  focus: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function createMesocycleAction(orgId: string, seasonId: string, macrocycleId: string, formData: FormData) {
  await assertCanCoach(orgId);
  const parsed = mesoSchema.parse({
    name: formData.get("name"),
    focus: formData.get("focus") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  await db.mesocycle.create({
    data: {
      macrocycleId,
      name: parsed.name,
      focus: parsed.focus,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    },
  });
  revalidatePath(`/org/${orgId}/training-plans/${seasonId}`);
}

const microSchema = z.object({
  teamId: z.string().min(1),
  weekNumber: z.coerce.number().int().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  theme: z.string().optional(),
  notes: z.string().optional(),
});

export async function createMicrocycleAction(
  orgId: string,
  seasonId: string,
  mesocycleId: string,
  teamId: string,
  formData: FormData
) {
  await assertCanCoach(orgId);
  const parsed = microSchema.parse({
    teamId,
    weekNumber: formData.get("weekNumber"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    theme: formData.get("theme") || undefined,
    notes: formData.get("notes") || undefined,
  });
  await db.microcycle.create({
    data: {
      mesocycleId,
      teamId: parsed.teamId,
      weekNumber: parsed.weekNumber,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      theme: parsed.theme,
      notes: parsed.notes,
    },
  });
  revalidatePath(`/org/${orgId}/training-plans/${seasonId}`);
}

const sessionSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  focus: z.string().min(2),
  intensityRpe: z.coerce.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export async function createTrainingSessionAction(orgId: string, microcycleId: string, formData: FormData) {
  const { user } = await assertCanCoach(orgId);
  const parsed = sessionSchema.parse({
    date: formData.get("date"),
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    location: formData.get("location") || undefined,
    focus: formData.get("focus"),
    intensityRpe: formData.get("intensityRpe") || undefined,
    notes: formData.get("notes") || undefined,
  });
  await db.trainingSession.create({
    data: {
      microcycleId,
      date: new Date(parsed.date),
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      location: parsed.location,
      focus: parsed.focus,
      intensityRpe: parsed.intensityRpe,
      notes: parsed.notes,
      createdById: user.id,
    },
  });
  revalidatePath(`/org/${orgId}/training-plans/microcycle/${microcycleId}`);
}

const drillSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  description: z.string().optional(),
  durationMin: z.coerce.number().int().min(1).optional(),
  equipment: z.string().optional(),
});

export async function createDrillAction(orgId: string, formData: FormData) {
  await assertCanCoach(orgId);
  const parsed = drillSchema.parse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    durationMin: formData.get("durationMin") || undefined,
    equipment: formData.get("equipment") || undefined,
  });
  await db.drill.create({ data: { organizationId: orgId, ...parsed } });
  revalidatePath(`/org/${orgId}/training-plans`);
}

export async function addSessionDrillAction(orgId: string, microcycleId: string, sessionId: string, formData: FormData) {
  await assertCanCoach(orgId);
  const drillId = String(formData.get("drillId"));
  const durationMin = formData.get("durationMin") ? Number(formData.get("durationMin")) : undefined;
  const notes = (formData.get("notes") as string) || undefined;
  const count = await db.sessionDrill.count({ where: { sessionId } });
  await db.sessionDrill.create({
    data: { sessionId, drillId, durationMin, notes, orderIndex: count },
  });
  revalidatePath(`/org/${orgId}/training-plans/microcycle/${microcycleId}`);
}
