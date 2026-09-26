import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { addTeamMemberAction, removeTeamMemberAction, updateTeamMembershipAction } from "@/lib/actions/teams";
import { isAdmin, ROLE_LABELS, TEAM_ROLE_LABELS } from "@/lib/roles";
import { generateSuggestedPassword } from "@/lib/password";

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
            <CardHeader
              title="Roster"
              subtitle={`${team.memberships.length} members${canManage ? " · click Edit to fix a role, jersey or position" : ""}`}
            />
            <CardBody className="p-0">
              {team.memberships.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No members yet" subtitle="Add coaches, athletes and staff to this team." />
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {team.memberships.map((tm) => (
                    <li key={tm.id} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Link href={`/org/${orgId}/members/${tm.userId}`} className="font-medium text-slate-800 hover:text-brand-700 hover:underline">
                            {tm.user.name}
                          </Link>
                          <p className="text-xs text-slate-400">{tm.user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge color={tm.role === "HOD" ? "purple" : "blue"}>{TEAM_ROLE_LABELS[tm.role] ?? tm.role}</Badge>
                          {tm.jerseyNumber && <Badge color="slate">#{tm.jerseyNumber}</Badge>}
                          {tm.position && <Badge color="slate">{tm.position}</Badge>}
                        </div>
                      </div>

                      {canManage && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-brand-600">Edit</summary>
                          <form
                            action={updateTeamMembershipAction.bind(null, orgId, teamId, tm.id)}
                            className="mt-2 flex flex-wrap items-end gap-2"
                          >
                            <div className="w-40">
                              <Select name="teamRole" defaultValue={tm.role} className="text-xs">
                                {Object.entries(TEAM_ROLE_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>
                                    {l}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <Input name="jerseyNumber" defaultValue={tm.jerseyNumber ?? ""} placeholder="Jersey #" className="w-24 text-xs" />
                            <Input name="position" defaultValue={tm.position ?? ""} placeholder="Position" className="w-32 text-xs" />
                            <Button type="submit" size="sm">
                              Save
                            </Button>
                            <span className="mx-1 h-5 w-px bg-slate-200" />
                            <button
                              type="submit"
                              formAction={removeTeamMemberAction.bind(null, orgId, teamId, tm.id)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Remove from team
                            </button>
                          </form>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
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
                    {Object.entries(TEAM_ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Temporary password">
                  <Input name="tempPassword" defaultValue={generateSuggestedPassword()} required minLength={8} />
                </Field>
                <p className="text-xs text-slate-400">
                  Only used if this email isn't already a member. Share it with them directly (WhatsApp, in person) — they can change it
                  from My Account after logging in.
                </p>
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
