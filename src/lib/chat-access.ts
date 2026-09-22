import { db } from "@/lib/db";
import { isAdmin } from "@/lib/roles";

/**
 * Shared by the chat server actions and the polling API route
 * (/api/chat/[channelId]/messages) so both enforce identical rules:
 *   TEAM             — open to anyone in the org (unchanged legacy behaviour).
 *   DIRECT / GROUP    — only listed ChatParticipant rows.
 *   PARENT_BROADCAST — anyone with role PARENT (or an admin) can read;
 *                       only admins can post.
 */
export async function assertChannelAccess(
  orgId: string,
  channelId: string,
  userId: string,
  userRole: string,
  mode: "read" | "post"
) {
  const channel = await db.chatChannel.findFirst({ where: { id: channelId, organizationId: orgId } });
  if (!channel) throw new Error("Channel not found.");

  if (channel.kind === "TEAM") return channel;

  if (channel.kind === "DIRECT" || channel.kind === "GROUP") {
    const participant = await db.chatParticipant.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!participant) throw new Error("You don't have access to this conversation.");
    return channel;
  }

  if (channel.kind === "PARENT_BROADCAST") {
    if (mode === "post") {
      if (!isAdmin(userRole)) throw new Error("Only admins can post to parent notices.");
    } else if (userRole !== "PARENT" && !isAdmin(userRole)) {
      throw new Error("You don't have access to this channel.");
    }
    return channel;
  }

  throw new Error("Unknown channel kind.");
}
