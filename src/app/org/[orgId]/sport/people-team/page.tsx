import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Card, CardBody, EmptyState, PageHeader, Select, Button } from "@/components/ui";

export default async function PeopleTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ teamId?: string }>;
}) {
  const { orgId } = await params;
  const { teamId: queryTeamId } = await searchParams;
  await requireOrgMembership(orgId);

  const teams = await db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
  const teamId = queryTeamId ?? teams[0]?.id;

  const roster = teamId
    ? await db.teamMembership.findMany({
        where: { teamId },
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="People & Team"
        subtitle="Roster — name, surname and position for the selected team."
        action={
          teamId ? (
            <a href={`/api/export/${orgId}?type=people-team&teamId=${teamId}`} className="text-sm font-medium text-brand-600 hover:underline">
              Export CSV →
            </a>
          ) : undefined
        }
      />

      {teams.length === 0 ? (
        <EmptyState title="No teams yet" subtitle="Create a team first, from Teams & Members." />
      ) : (
        <>
          <form method="get" className="mb-6 flex max-w-xs items-end gap-2">
            <div className="flex-1">
              <Select name="teamId" defaultValue={teamId}>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Switch team
            </Button>
          </form>

          <Card>
            <CardBody className="p-0">
              {roster.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No roster members yet" subtitle="Add athletes from Teams & Members." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Surname</th>
                        <th className="px-4 py-2">Position</th>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Jersey #</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {roster.map((r) => {
                        const [firstName, ...rest] = r.user.name.split(" ");
                        return (
                          <tr key={r.id}>
                            <td className="px-4 py-2.5 font-medium text-slate-900">{firstName}</td>
                            <td className="px-4 py-2.5">{rest.join(" ") || "—"}</td>
                            <td className="px-4 py-2.5">{r.position ?? "—"}</td>
                            <td className="px-4 py-2.5 text-slate-500">{r.role}</td>
                            <td className="px-4 py-2.5">{r.jerseyNumber ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
