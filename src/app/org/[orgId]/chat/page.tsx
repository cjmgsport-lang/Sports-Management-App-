import Link from "next/link";
import { clsx } from "clsx";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, EmptyState, Input, PageHeader, Textarea } from "@/components/ui";
import { ChatMessages } from "@/components/chat-messages";
import {
  createChannelAction,
  createDirectMessageAction,
  createGroupChatAction,
  createParentBroadcastAction,
  sendMessageAction,
} from "@/lib/actions/chat";
import { assertChannelAccess } from "@/lib/chat-access";
import { canCoach, isAdmin } from "@/lib/roles";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ channelId?: string }>;
}) {
  const { orgId } = await params;
  const { channelId } = await searchParams;
  const { user, membership } = await requireOrgMembership(orgId);

  const teams = await db.team.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    include: {
      channels: { where: { kind: "TEAM" }, orderBy: { createdAt: "asc" } },
      memberships: { include: { user: true }, orderBy: { user: { name: "asc" } } },
    },
  });

  const [directChannels, groupChannels, parentBroadcast, orgMembers] = await Promise.all([
    db.chatChannel.findMany({
      where: { organizationId: orgId, kind: "DIRECT", participants: { some: { userId: user.id } } },
      include: { participants: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.chatChannel.findMany({
      where: { organizationId: orgId, kind: "GROUP", participants: { some: { userId: user.id } } },
      include: { team: true },
      orderBy: { createdAt: "desc" },
    }),
    db.chatChannel.findFirst({ where: { organizationId: orgId, kind: "PARENT_BROADCAST" } }),
    db.membership.findMany({ where: { organizationId: orgId }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  const teamChannels = teams.flatMap((t) => t.channels.map((c) => ({ ...c, teamName: t.name })));
  const directChannelsWithLabel = directChannels.map((c) => {
    const other = c.participants.find((p) => p.userId !== user.id)?.user;
    return { ...c, label: other?.name ?? "Direct message" };
  });

  const canSeeParentBroadcast = !!parentBroadcast && (membership.role === "PARENT" || isAdmin(membership.role));
  const canCreateUnits = canCoach(membership.role);

  const allSelectable = [
    ...teamChannels.map((c) => ({ id: c.id })),
    ...directChannelsWithLabel.map((c) => ({ id: c.id })),
    ...groupChannels.map((c) => ({ id: c.id })),
    ...(canSeeParentBroadcast && parentBroadcast ? [{ id: parentBroadcast.id }] : []),
  ];
  const activeChannelId = channelId ?? allSelectable[0]?.id;

  let activeChannel = null;
  if (activeChannelId) {
    try {
      await assertChannelAccess(orgId, activeChannelId, user.id, membership.role, "read");
      activeChannel = await db.chatChannel.findFirst({
        where: { id: activeChannelId, organizationId: orgId },
        include: { team: true, messages: { orderBy: { createdAt: "asc" }, include: { author: true } }, participants: { include: { user: true } } },
      });
    } catch {
      activeChannel = null;
    }
  }

  const activeChannelTitle = activeChannel
    ? activeChannel.kind === "DIRECT"
      ? activeChannel.participants.find((p) => p.userId !== user.id)?.user.name ?? "Direct message"
      : activeChannel.name
    : null;
  const activeChannelSubtitle = activeChannel
    ? activeChannel.kind === "TEAM"
      ? activeChannel.team?.name
      : activeChannel.kind === "GROUP"
        ? `Unit${activeChannel.team ? ` · ${activeChannel.team.name}` : ""}`
        : activeChannel.kind === "PARENT_BROADCAST"
          ? "Admin notices to parents"
          : "Direct message"
    : null;

  const canPostToActive = activeChannel?.kind !== "PARENT_BROADCAST" || isAdmin(membership.role);

  return (
    <div>
      <PageHeader title="Chat" subtitle="Live team channels, direct messages, coach-curated units and parent notices." />

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardBody className="scrollbar-thin max-h-[75vh] space-y-5 overflow-y-auto p-3">
            {/* Team channels */}
            <div>
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Team Channels</p>
              <div className="space-y-1">
                {teamChannels.map((c) => (
                  <Link
                    key={c.id}
                    href={`/org/${orgId}/chat?channelId=${c.id}`}
                    className={clsx(
                      "block rounded-lg px-3 py-2 text-sm",
                      c.id === activeChannelId ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-medium">#{c.name}</p>
                    <p className="text-xs text-slate-400">{c.teamName}</p>
                  </Link>
                ))}
                {teamChannels.length === 0 && <p className="px-2 text-sm text-slate-400">No channels yet.</p>}
              </div>
              <form action={createChannelAction.bind(null, orgId)} className="mt-2 space-y-2 px-2">
                <select name="teamId" required className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Input name="name" required placeholder="Channel name" />
                <Button type="submit" size="sm" className="w-full">
                  New channel
                </Button>
              </form>
            </div>

            {/* Direct messages */}
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Direct Messages</p>
              <div className="space-y-1">
                {directChannelsWithLabel.map((c) => (
                  <Link
                    key={c.id}
                    href={`/org/${orgId}/chat?channelId=${c.id}`}
                    className={clsx(
                      "block rounded-lg px-3 py-2 text-sm",
                      c.id === activeChannelId ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-medium">{c.label}</p>
                  </Link>
                ))}
                {directChannelsWithLabel.length === 0 && <p className="px-2 text-sm text-slate-400">No direct messages yet.</p>}
              </div>
              <form action={createDirectMessageAction.bind(null, orgId)} className="mt-2 flex gap-2 px-2">
                <select name="otherUserId" required className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                  {orgMembers
                    .filter((m) => m.userId !== user.id)
                    .map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name}
                      </option>
                    ))}
                </select>
                <Button type="submit" size="sm">
                  Message
                </Button>
              </form>
            </div>

            {/* Units */}
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Units</p>
              <div className="space-y-1">
                {groupChannels.map((c) => (
                  <Link
                    key={c.id}
                    href={`/org/${orgId}/chat?channelId=${c.id}`}
                    className={clsx(
                      "block rounded-lg px-3 py-2 text-sm",
                      c.id === activeChannelId ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <p className="font-medium">{c.name}</p>
                    {c.team && <p className="text-xs text-slate-400">{c.team.name}</p>}
                  </Link>
                ))}
                {groupChannels.length === 0 && <p className="px-2 text-sm text-slate-400">No units yet.</p>}
              </div>
              {canCreateUnits &&
                teams.map((t) => (
                  <details key={t.id} className="mt-2 px-2">
                    <summary className="cursor-pointer text-xs font-medium text-brand-600">+ New unit in {t.name}</summary>
                    <form action={createGroupChatAction.bind(null, orgId, t.id)} className="mt-2 space-y-2">
                      <Input name="name" required placeholder="Unit name (e.g. Strikers)" />
                      <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                        {t.memberships.map((tm) => (
                          <label key={tm.userId} className="flex items-center gap-2 text-xs text-slate-600">
                            <input type="checkbox" name="memberIds" value={tm.userId} className="h-3.5 w-3.5 rounded border-slate-300" />
                            {tm.user.name}
                          </label>
                        ))}
                        {t.memberships.length === 0 && <p className="text-xs text-slate-400">No roster members yet.</p>}
                      </div>
                      <Button type="submit" size="sm" className="w-full">
                        Create unit
                      </Button>
                    </form>
                  </details>
                ))}
            </div>

            {/* Parent notices */}
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Parent Notices</p>
              {parentBroadcast && canSeeParentBroadcast ? (
                <Link
                  href={`/org/${orgId}/chat?channelId=${parentBroadcast.id}`}
                  className={clsx(
                    "block rounded-lg px-3 py-2 text-sm",
                    parentBroadcast.id === activeChannelId ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <p className="font-medium">{parentBroadcast.name}</p>
                </Link>
              ) : (
                <p className="px-2 text-sm text-slate-400">
                  {parentBroadcast ? "Visible to parents and admins." : "Not set up yet."}
                </p>
              )}
              {!parentBroadcast && isAdmin(membership.role) && (
                <form action={createParentBroadcastAction.bind(null, orgId)} className="mt-2 px-2">
                  <Button type="submit" size="sm" variant="secondary" className="w-full">
                    Create parent notices channel
                  </Button>
                </form>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="flex flex-col lg:col-span-3">
          {!activeChannel ? (
            <CardBody>
              <EmptyState title="No channel selected" subtitle="Pick a conversation from the list, or start a new one." />
            </CardBody>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {activeChannel.kind === "TEAM" || activeChannel.kind === "GROUP" ? `#${activeChannelTitle}` : activeChannelTitle}
                  </p>
                  <p className="text-xs text-slate-400">{activeChannelSubtitle}</p>
                </div>
                {activeChannel.kind === "PARENT_BROADCAST" && <Badge color="purple">Broadcast</Badge>}
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
              {canPostToActive ? (
                <form action={sendMessageAction.bind(null, orgId, activeChannel.id)} className="flex gap-2 border-t border-slate-100 px-5 py-3">
                  <Textarea name="body" required rows={1} placeholder="Write a message…" className="flex-1" />
                  <Button type="submit">Send</Button>
                </form>
              ) : (
                <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                  Only admins can post here — you can read, but not reply.
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
