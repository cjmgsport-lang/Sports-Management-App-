import Link from "next/link";
import { clsx } from "clsx";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, EmptyState, Input, PageHeader, Textarea } from "@/components/ui";
import { ChatMessages } from "@/components/chat-messages";
import { createLeadershipChatAction, sendMessageAction } from "@/lib/actions/chat";
import { assertChannelAccess } from "@/lib/chat-access";
import { canCoach } from "@/lib/roles";

export default async function LeadershipChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ channelId?: string }>;
}) {
  const { orgId } = await params;
  const { channelId } = await searchParams;
  const { user, membership } = await requireOrgMembership(orgId);

  const [channels, orgMembers] = await Promise.all([
    db.chatChannel.findMany({
      where: { organizationId: orgId, kind: "LEADERSHIP", participants: { some: { userId: user.id } } },
      include: { participants: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.membership.findMany({ where: { organizationId: orgId }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  const canCreate = canCoach(membership.role);
  const activeChannelId = channelId ?? channels[0]?.id;

  let activeChannel = null;
  if (activeChannelId) {
    try {
      await assertChannelAccess(orgId, activeChannelId, user.id, membership.role, "read");
      activeChannel = await db.chatChannel.findFirst({
        where: { id: activeChannelId, organizationId: orgId },
        include: { messages: { orderBy: { createdAt: "asc" }, include: { author: true } }, participants: { include: { user: true } } },
      });
    } catch {
      activeChannel = null;
    }
  }

  return (
    <div>
      <PageHeader title="Leadership Chat" subtitle="A private space for captains, vice-captains and senior players to talk with the coaching staff." />

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardBody className="space-y-3 p-3">
            <div className="space-y-1">
              {channels.map((c) => (
                <Link
                  key={c.id}
                  href={`/org/${orgId}/sport/leadership-chat?channelId=${c.id}`}
                  className={clsx(
                    "block rounded-lg px-3 py-2 text-sm",
                    c.id === activeChannelId ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.participants.length} members</p>
                </Link>
              ))}
              {channels.length === 0 && <p className="px-2 text-sm text-slate-400">No leadership chats yet.</p>}
            </div>

            {canCreate && (
              <details className="border-t border-slate-100 pt-3">
                <summary className="cursor-pointer text-xs font-medium text-brand-600">+ New leadership chat</summary>
                <form action={createLeadershipChatAction.bind(null, orgId)} className="mt-2 space-y-2">
                  <Input name="name" required placeholder="e.g. Leadership Group" />
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                    {orgMembers
                      .filter((m) => m.userId !== user.id)
                      .map((m) => (
                        <label key={m.userId} className="flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" name="memberIds" value={m.userId} className="h-3.5 w-3.5 rounded border-slate-300" />
                          {m.user.name}
                        </label>
                      ))}
                  </div>
                  <Button type="submit" size="sm" className="w-full">
                    Create
                  </Button>
                </form>
              </details>
            )}
          </CardBody>
        </Card>

        <Card className="flex flex-col lg:col-span-3">
          {!activeChannel ? (
            <CardBody>
              <EmptyState title="No chat selected" subtitle="Pick a leadership chat from the list, or create a new one." />
            </CardBody>
          ) : (
            <>
              <div className="border-b border-slate-100 px-5 py-3">
                <p className="font-semibold text-slate-900">{activeChannel.name}</p>
                <p className="text-xs text-slate-400">{activeChannel.participants.map((p) => p.user.name).join(", ")}</p>
              </div>
              <ChatMessages
                key={activeChannel.id}
                channelId={activeChannel.id}
                currentUserId={user.id}
                initialMessages={activeChannel.messages.map((m) => ({
                  id: m.id,
                  body: m.body,
                  createdAt: m.createdAt.toISOString(),
                  author: { id: m.author.id, name: m.author.name },
                }))}
              />
              <form action={sendMessageAction.bind(null, orgId, activeChannel.id)} className="flex gap-2 border-t border-slate-100 px-5 py-3">
                <Textarea name="body" required rows={1} placeholder="Write a message…" className="flex-1" />
                <Button type="submit">Send</Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
