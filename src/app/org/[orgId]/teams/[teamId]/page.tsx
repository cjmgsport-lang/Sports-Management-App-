import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { addTeamMemberAction, removeTeamMemberAction } from "@/lib/actions/teams";
import { isAdmin, ROLE_LABELS } from "@/lib/roles";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; teamId: string }>;
}) {
  const { orgId, teamId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const team = await db.team.findFirst({
    where: { id: teamId, organizationId: orgId },
    include: {
      memberships: { include: { user: true }, orderBy: { role: "asc" } },
    },
  });
  if (!team) notFound();

  const canManage = isAdmin(membership.role) || membership.role === "COACH" || membership.role === "MANAGER";

  return (
    <div>
      <PageHeader
        title={team.name}
        subtitle={`${team.sport}${team.ageGroup ? ` · ${team.ageGroup}` : ""}${team.season ? ` · ${team.season}` : ""}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Roster" subtitle={`${team.memberships.length} members`} />
            <CardBody className="p-0">
              {team.memberships.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No members yet" subtitle="Add coaches, athletes and staff to this team." />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-5 py-2">Name</th>
                      <th className="px-5 py-2">Team role</th>
                      <th className="px-5 py-2">Jersey</th>
                      <th className="px-5 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {team.memberships.map((tm) => (
                      <tr key={tm.id}>
                        <td className="px-5 py-2.5">
                          <p className="font-medium text-slate-800">{tm.user.name}</p>
                          <p className="text-xs text-slate-400">{tm.user.email}</p>
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge color="blue">{tm.role.replace(/_/g, " ")}</Badge>
                        </td>
                        <td className="px-5 py-2.5 text-slate-500">{tm.jerseyNumber ?? "—"}</td>
                        <td className="px-5 py-2.5 text-right">
                          {canManage && (
                            <form action={removeTeamMemberAction.bind(null, orgId, teamId, tm.id)}>
                              <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        {canManage && (
          <Card className="self-start">
            <CardHeader title="Add member" subtitle="Existing org members are reused by email." />
            <CardBody>
              <form action={addTeamMemberAction.bind(null, orgId, teamId)} className="space-y-3">
                <Field label="Full name">
                  <Input name="name" required placeholder="Thabo Mokoena" />
                </Field>
                <Field label="Email">
                  <Input type="email" name="email" required placeholder="thabo@example.co.za" />
                </Field>
                <Field label="Organization role">
                  <Select name="orgRole" defaultValue="ATHLETE">
                    {Object.entries(ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Team role">
                  <Select name="teamRole" defaultValue="ATHLETE">
                    <option value="ATHLETE">Athlete</option>
                    <option value="HEAD_COACH">Head Coach</option>
                    <option value="ASSISTANT_COACH">Assistant Coach</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="MEDICAL">Medical</option>
                  </Select>
                </Field>
                <Button type="submit" className="w-full">
                  Add to team
                </Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
