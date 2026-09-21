import Link from "next/link";
import { clsx } from "clsx";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, EmptyState, Input, PageHeader, Textarea } from "@/components/ui";
import { createChannelAction, sendMessageAction } from "@/lib/actions/chat";
import { format } from "date-fns";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ channelId?: string }>;
}) {
  const { orgId } = await params;
  const { channelId } = await searchParams;
  await requireOrgMembership(orgId);

  const teams = await db.team.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    include: { channels: { orderBy: { createdAt: "asc" } } },
  });

  const allChannels = teams.flatMap((t) => t.channels.map((c) => ({ ...c, teamName: t.name })));
  const activeChannelId = channelId ?? allChannels[0]?.id;

  const activeChannel = activeChannelId
    ? await db.chatChannel.findFirst({
        where: { id: activeChannelId, team: { organizationId: orgId } },
        include: { team: true, messages: { orderBy: { createdAt: "asc" }, include: { author: true } } },
      })
    : null;

  return (
    <div>
      <PageHeader title="Chat" subtitle="Team channels for coaches, athletes, parents and staff." />

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardBody className="p-3">
            <p className="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Channels</p>
            <div className="space-y-1">
              {allChannels.map((c) => (
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
              {allChannels.length === 0 && <p className="px-2 text-sm text-slate-400">No channels yet.</p>}
            </div>

            <form action={createChannelAction.bind(null, orgId)} className="mt-4 space-y-2 border-t border-slate-100 pt-3">
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
          </CardBody>
        </Card>

        <Card className="flex flex-col lg:col-span-3">
          {!activeChannel ? (
            <CardBody>
              <EmptyState title="No channel selected" subtitle="Create a channel to start chatting." />
            </CardBody>
          ) : (
            <>
              <div className="border-b border-slate-100 px-5 py-3">
                <p className="font-semibold text-slate-900">#{activeChannel.name}</p>
                <p className="text-xs text-slate-400">{activeChannel.team.name}</p>
              </div>
              <div className="scrollbar-thin max-h-[50vh] flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {activeChannel.messages.length === 0 && <p className="text-sm text-slate-400">No messages yet. Say hello!</p>}
                {activeChannel.messages.map((m) => (
                  <div key={m.id}>
                    <p className="text-sm">
                      <span className="font-medium text-slate-800">{m.author.name}</span>{" "}
                      <span className="text-xs text-slate-400">{format(m.createdAt, "d MMM HH:mm")}</span>
                    </p>
                    <p className="text-sm text-slate-600">{m.body}</p>
                  </div>
                ))}
              </div>
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
