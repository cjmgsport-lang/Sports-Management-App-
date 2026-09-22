"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { isAdmin, canCoach } from "@/lib/roles";
import { assertChannelAccess } from "@/lib/chat-access";

export async function createChannelAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const teamId = z.string().min(1).parse(formData.get("teamId"));
  const name = z.string().min(2).parse(formData.get("name"));

  const team = await db.team.findFirst({ where: { id: teamId, organizationId: orgId } });
  if (!team) throw new Error("Team not found.");

  await db.chatChannel.create({
    data: { organizationId: orgId, teamId, name, kind: "TEAM", createdById: user.id },
  });
  revalidatePath(`/org/${orgId}/chat`);
}

export async function sendMessageAction(orgId: string, channelId: string, formData: FormData) {
  const { user, membership } = await requireOrgMembership(orgId);
  const body = z.string().min(1).parse(formData.get("body"));

  await assertChannelAccess(orgId, channelId, user.id, membership.role, "post");
  await db.chatMessage.create({ data: { channelId, authorId: user.id, body } });
  revalidatePath(`/org/${orgId}/chat`);
}

/** Starts (or reuses) a 1:1 direct message with another org member. */
export async function createDirectMessageAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const otherUserId = z.string().min(1).parse(formData.get("otherUserId"));
  if (otherUserId === user.id) throw new Error("You can't message yourself.");

  const otherMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: otherUserId, organizationId: orgId } },
  });
  if (!otherMembership) throw new Error("That person isn't a member of this organization.");

  const existing = await db.chatChannel.findFirst({
    where: {
      organizationId: orgId,
      kind: "DIRECT",
      participants: { some: { userId: user.id } },
      AND: [{ participants: { some: { userId: otherUserId } } }],
    },
  });

  const channel =
    existing ??
    (await db.chatChannel.create({
      data: {
        organizationId: orgId,
        kind: "DIRECT",
        name: "Direct message",
        createdById: user.id,
        participants: { create: [{ userId: user.id }, { userId: otherUserId }] },
      },
    }));

  redirect(`/org/${orgId}/chat?channelId=${channel.id}`);
}

/** Coach-curated small group chat ("unit") from a subset of a team's roster. */
export async function createGroupChatAction(orgId: string, teamId: string, formData: FormData) {
  const { user, membership } = await requireOrgMembership(orgId);
  if (!canCoach(membership.role)) throw new Error("You don't have permission to create a unit chat.");

  const name = z.string().min(2).parse(formData.get("name"));
  const memberIds = formData.getAll("memberIds").map((v) => String(v));
  if (memberIds.length === 0) throw new Error("Pick at least one member for the unit.");

  const team = await db.team.findFirst({ where: { id: teamId, organizationId: orgId } });
  if (!team) throw new Error("Team not found.");

  const participantIds = Array.from(new Set([user.id, ...memberIds]));

  await db.chatChannel.create({
    data: {
      organizationId: orgId,
      teamId,
      kind: "GROUP",
      name,
      createdById: user.id,
      participants: { create: participantIds.map((userId) => ({ userId })) },
    },
  });
  revalidatePath(`/org/${orgId}/chat`);
}

/** Org-wide admin -> parents broadcast channel. At most one per org. */
export async function createParentBroadcastAction(orgId: string) {
  const { user, membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can create the parent notices channel.");

  const existing = await db.chatChannel.findFirst({ where: { organizationId: orgId, kind: "PARENT_BROADCAST" } });
  if (!existing) {
    await db.chatChannel.create({
      data: { organizationId: orgId, kind: "PARENT_BROADCAST", name: "Parent Notices", createdById: user.id },
    });
  }
  revalidatePath(`/org/${orgId}/chat`);
}
