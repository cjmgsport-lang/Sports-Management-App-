"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

export async function createFixtureTemplateAction(orgId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      name: z.string().min(2),
      sport: z.string().min(2),
      defaultDurationMin: z.coerce.number().int().optional(),
      defaultVenue: z.string().optional(),
      rulesNotes: z.string().optional(),
    })
    .parse({
      name: formData.get("name"),
      sport: formData.get("sport"),
      defaultDurationMin: formData.get("defaultDurationMin") || undefined,
      defaultVenue: formData.get("defaultVenue") || undefined,
      rulesNotes: formData.get("rulesNotes") || undefined,
    });
  await db.fixtureTemplate.create({ data: { organizationId: orgId, ...parsed } });
  revalidatePath(`/org/${orgId}/fixtures`);
}

export async function createTournamentAction(orgId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      name: z.string().min(2),
      startDate: z.string().min(1),
      endDate: z.string().min(1),
      venue: z.string().optional(),
      format: z.string().optional(),
      description: z.string().optional(),
    })
    .parse({
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      venue: formData.get("venue") || undefined,
      format: formData.get("format") || undefined,
      description: formData.get("description") || undefined,
    });
  await db.tournament.create({
    data: {
      organizationId: orgId,
      name: parsed.name,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      venue: parsed.venue,
      format: parsed.format,
      description: parsed.description,
    },
  });
  revalidatePath(`/org/${orgId}/tournaments`);
}

export async function createFixtureAction(orgId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      teamId: z.string().min(1),
      opponent: z.string().min(1),
      homeAway: z.enum(["HOME", "AWAY", "NEUTRAL"]),
      venue: z.string().optional(),
      startsAt: z.string().min(1),
      tournamentId: z.string().optional(),
      templateId: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse({
      teamId: formData.get("teamId"),
      opponent: formData.get("opponent"),
      homeAway: formData.get("homeAway"),
      venue: formData.get("venue") || undefined,
      startsAt: formData.get("startsAt"),
      tournamentId: formData.get("tournamentId") || undefined,
      templateId: formData.get("templateId") || undefined,
      notes: formData.get("notes") || undefined,
    });

  await db.fixture.create({
    data: {
      organizationId: orgId,
      teamId: parsed.teamId,
      opponent: parsed.opponent,
      homeAway: parsed.homeAway,
      venue: parsed.venue,
      startsAt: new Date(parsed.startsAt),
      tournamentId: parsed.tournamentId || null,
      templateId: parsed.templateId || null,
      notes: parsed.notes,
    },
  });
  revalidatePath(`/org/${orgId}/fixtures`);
}

export async function recordResultAction(orgId: string, fixtureId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const parsed = z
    .object({
      ourScore: z.coerce.number().int().min(0),
      opponentScore: z.coerce.number().int().min(0),
      summary: z.string().optional(),
      statsJson: z.string().optional(),
    })
    .parse({
      ourScore: formData.get("ourScore"),
      opponentScore: formData.get("opponentScore"),
      summary: formData.get("summary") || undefined,
      statsJson: formData.get("statsJson") || undefined,
    });

  await db.fixture.update({
    where: { id: fixtureId },
    data: { ourScore: parsed.ourScore, opponentScore: parsed.opponentScore, status: "COMPLETED" },
  });

  await db.matchResult.upsert({
    where: { fixtureId },
    update: { summary: parsed.summary, statsJson: parsed.statsJson },
    create: { fixtureId, summary: parsed.summary, statsJson: parsed.statsJson, createdById: user.id },
  });

  revalidatePath(`/org/${orgId}/fixtures/${fixtureId}`);
  revalidatePath(`/org/${orgId}/fixtures`);
}
