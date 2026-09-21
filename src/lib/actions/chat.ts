"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

export async function createChannelAction(orgId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const teamId = z.string().min(1).parse(formData.get("teamId"));
  const name = z.string().min(2).parse(formData.get("name"));

  const team = await db.team.findFirst({ where: { id: teamId, organizationId: orgId } });
  if (!team) throw new Error("Team not found.");

  await db.chatChannel.create({ data: { teamId, name } });
  revalidatePath(`/org/${orgId}/chat`);
}

export async function sendMessageAction(orgId: string, channelId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const body = z.string().min(1).parse(formData.get("body"));

  await db.chatMessage.create({ data: { channelId, authorId: user.id, body } });
  revalidatePath(`/org/${orgId}/chat`);
}
