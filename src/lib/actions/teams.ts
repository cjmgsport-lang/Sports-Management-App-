"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { isAdmin } from "@/lib/roles";
import { seatLimitForPlan } from "@/lib/plan-limits";

const createTeamSchema = z.object({
  name: z.string().min(2),
  sport: z.string().min(2),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
  season: z.string().optional(),
});

export async function createTeamAction(orgId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role) && membership.role !== "COACH" && membership.role !== "MANAGER") {
    throw new Error("You don't have permission to create teams.");
  }

  const parsed = createTeamSchema.parse({
    name: formData.get("name"),
    sport: formData.get("sport"),
    ageGroup: formData.get("ageGroup") || undefined,
    gender: formData.get("gender") || undefined,
    season: formData.get("season") || undefined,
  });

  await db.team.create({ data: { organizationId: orgId, ...parsed } });
  revalidatePath(`/org/${orgId}/teams`);
}

const addMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  orgRole: z.enum([
    "OWNER",
    "ADMIN",
    "HOD",
    "COACH",
    "ASSISTANT_COACH",
    "MEDICAL",
    "MANAGER",
    "ANALYST",
    "ADMIN_ASSISTANT",
    "LOGISTICS_MANAGER",
    "PERFORMANCE_PSYCH",
    "PHYSIO",
    "STRENGTH_CONDITIONING",
    "ATHLETE",
    "PARENT",
    "STAFF",
  ]),
  teamRole: z.enum(["HEAD_COACH", "ASSISTANT_COACH", "HOD", "MANAGER", "ANALYST", "MEDICAL", "ATHLETE"]),
  tempPassword: z.string().min(8).optional(),
});

export async function addTeamMemberAction(orgId: string, teamId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role) && membership.role !== "COACH" && membership.role !== "MANAGER") {
    throw new Error("You don't have permission to add members.");
  }

  const parsed = addMemberSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    orgRole: formData.get("orgRole"),
    teamRole: formData.get("teamRole"),
    tempPassword: formData.get("tempPassword") || undefined,
  });
  const email = parsed.email.toLowerCase().trim();

  let user = await db.user.findUnique({ where: { email } });
  const isNewOrgMember = !user || !(await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  }));

  if (isNewOrgMember) {
    const subscription = await db.subscription.findUnique({ where: { organizationId: orgId } });
    const seatLimit = subscription ? subscription.seats : seatLimitForPlan("STARTER");
    const seatsUsed = await db.membership.count({ where: { organizationId: orgId } });
    if (seatsUsed >= seatLimit) {
      throw new Error(
        `This organization has reached its plan's seat limit (${seatLimit} members). Upgrade the plan in Settings to add more members.`
      );
    }
  }

  if (!user) {
    if (!parsed.tempPassword) throw new Error("A temporary password is required for a brand-new member.");
    user = await db.user.create({
      data: { name: parsed.name, email, passwordHash: await bcrypt.hash(parsed.tempPassword, 10) },
    });
  }

  await db.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    update: {},
    create: { userId: user.id, organizationId: orgId, role: parsed.orgRole },
  });

  await db.teamMembership.upsert({
    where: { teamId_userId: { teamId, userId: user.id } },
    update: { role: parsed.teamRole },
    create: { teamId, userId: user.id, role: parsed.teamRole },
  });

  revalidatePath(`/org/${orgId}/teams/${teamId}`);
}

export async function removeTeamMemberAction(orgId: string, teamId: string, teamMembershipId: string) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role) && membership.role !== "COACH" && membership.role !== "MANAGER") {
    throw new Error("You don't have permission to remove members.");
  }
  await db.teamMembership.delete({ where: { id: teamMembershipId } });
  revalidatePath(`/org/${orgId}/teams/${teamId}`);
}

const editRosterSchema = z.object({
  teamRole: z.enum(["HEAD_COACH", "ASSISTANT_COACH", "HOD", "MANAGER", "ANALYST", "MEDICAL", "ATHLETE"]),
  jerseyNumber: z.string().optional(),
  position: z.string().optional(),
});

/** Fixes a roster entry's team role, jersey number or position after the fact. */
export async function updateTeamMembershipAction(orgId: string, teamId: string, teamMembershipId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role) && membership.role !== "COACH" && membership.role !== "MANAGER") {
    throw new Error("You don't have permission to edit roster entries.");
  }
  const parsed = editRosterSchema.parse({
    teamRole: formData.get("teamRole"),
    jerseyNumber: formData.get("jerseyNumber") || undefined,
    position: formData.get("position") || undefined,
  });
  await db.teamMembership.update({
    where: { id: teamMembershipId, teamId },
    data: { role: parsed.teamRole, jerseyNumber: parsed.jerseyNumber, position: parsed.position },
  });
  revalidatePath(`/org/${orgId}/teams/${teamId}`);
}
