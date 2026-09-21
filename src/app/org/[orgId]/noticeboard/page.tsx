import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { createNoticeAction, deleteNoticeAction } from "@/lib/actions/noticeboard";
import { format } from "date-fns";

export default async function NoticeboardPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const teams = await db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
  const notices = await db.notice.findMany({
    where: { organizationId: orgId },
    include: { author: true, team: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader title="Noticeboard" subtitle="Announcements for coaches, athletes, parents and staff." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {notices.length === 0 ? (
            <EmptyState title="No notices yet" subtitle="Post your first announcement." />
          ) : (
            notices.map((n) => (
              <Card key={n.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {n.pinned && <Badge color="amber">Pinned</Badge>}
                        <Badge color="blue">{n.audience}</Badge>
                        {n.team && <Badge>{n.team.name}</Badge>}
                      </div>
                      <p className="mt-1.5 font-semibold text-slate-900">{n.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {n.author.name} · {format(n.createdAt, "d MMM yyyy, HH:mm")}
                      </p>
                    </div>
                    <form action={deleteNoticeAction.bind(null, orgId, n.id)}>
                      <button className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                    </form>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="New notice" />
          <CardBody>
            <form action={createNoticeAction.bind(null, orgId)} className="space-y-3">
              <Field label="Title">
                <Input name="title" required placeholder="Kit collection this Friday" />
              </Field>
              <Field label="Message">
                <Textarea name="body" required rows={3} />
              </Field>
              <Field label="Audience">
                <Select name="audience" defaultValue="ALL">
                  <option value="ALL">Everyone</option>
                  <option value="COACHES">Coaches</option>
                  <option value="PARENTS">Parents</option>
                  <option value="ATHLETES">Athletes</option>
                  <option value="STAFF">Staff</option>
                </Select>
              </Field>
              <Field label="Team (optional)">
                <Select name="teamId" defaultValue="">
                  <option value="">Whole organization</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="pinned" className="h-4 w-4 rounded border-slate-300" />
                Pin to top
              </label>
              <Button type="submit" className="w-full">
                Post notice
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
