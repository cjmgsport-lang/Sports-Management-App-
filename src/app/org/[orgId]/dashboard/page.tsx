import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Card, CardBody, LinkButton, PageHeader } from "@/components/ui";
import { format } from "date-fns";

export default async function DashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const [teamCount, memberCount, upcomingEvents, openNotices, upcomingFixtures, resourceCount] = await Promise.all([
    db.team.count({ where: { organizationId: orgId } }),
    db.membership.count({ where: { organizationId: orgId } }),
    db.calendarEvent.findMany({
      where: { team: { organizationId: orgId }, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { team: true },
    }),
    db.notice.findMany({
      where: { organizationId: orgId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    db.fixture.findMany({
      where: { organizationId: orgId, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { team: true },
    }),
    db.resource.count({ where: { organizationId: orgId } }),
  ]);

  const stats = [
    { label: "Teams", value: teamCount },
    { label: "Members", value: memberCount },
    { label: "Upcoming fixtures", value: upcomingFixtures.length },
    { label: "Shared resources", value: resourceCount },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A quick look at what's happening across your organization." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Upcoming calendar</h3>
              <LinkButton href={`/org/${orgId}/calendar`} variant="ghost" className="!px-2 !py-1 text-xs">
                View all
              </LinkButton>
            </div>
            {upcomingEvents.length === 0 && <p className="text-sm text-slate-400">No upcoming events.</p>}
            <ul className="space-y-2">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium text-slate-800">{e.title}</p>
                  <p className="text-slate-400">
                    {e.team.name} · {format(e.startsAt, "EEE d MMM, HH:mm")}
                  </p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Noticeboard</h3>
              <LinkButton href={`/org/${orgId}/noticeboard`} variant="ghost" className="!px-2 !py-1 text-xs">
                View all
              </LinkButton>
            </div>
            {openNotices.length === 0 && <p className="text-sm text-slate-400">No notices yet.</p>}
            <ul className="space-y-2">
              {openNotices.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className="font-medium text-slate-800">
                    {n.pinned && "📌 "}
                    {n.title}
                  </p>
                  <p className="line-clamp-1 text-slate-400">{n.body}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Upcoming fixtures</h3>
              <LinkButton href={`/org/${orgId}/fixtures`} variant="ghost" className="!px-2 !py-1 text-xs">
                View all
              </LinkButton>
            </div>
            {upcomingFixtures.length === 0 && <p className="text-sm text-slate-400">No fixtures scheduled.</p>}
            <ul className="space-y-2">
              {upcomingFixtures.map((f) => (
                <li key={f.id} className="text-sm">
                  <p className="font-medium text-slate-800">
                    {f.team.name} vs {f.opponent}
                  </p>
                  <p className="text-slate-400">{format(f.startsAt, "EEE d MMM, HH:mm")}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
