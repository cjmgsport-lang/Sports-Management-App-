import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Polled by the chat UI every couple of seconds to pick up messages sent by
// other people since the client's last-seen timestamp — a simple,
// infra-free way to get a "live" feel on a serverless host where long-lived
// WebSocket/SSE connections aren't reliable.
export async function GET(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const after = req.nextUrl.searchParams.get("after");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channel = await db.chatChannel.findUnique({ where: { id: channelId }, include: { team: true } });
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: channel.team.organizationId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await db.chatMessage.findMany({
    where: {
      channelId,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true } } },
    take: 100,
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      author: m.author,
    })),
  });
}
