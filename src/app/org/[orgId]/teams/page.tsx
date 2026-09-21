import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { createTeamAction } from "@/lib/actions/teams";
import { isAdmin } from "@/lib/roles";

export default async function TeamsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const teams = await db.team.findMany({
    where: { organizationId: orgId },
    include: { _count: { select: { memberships: true } } },
    orderBy: { name: "asc" },
  });

  const canManage = isAdmin(membership.role) || membership.role === "COACH" || membership.role === "MANAGER";

  return (
    <div>
      <PageHeader title="Teams & Members" subtitle="Create teams and manage rosters across your organization." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {teams.length === 0 ? (
            <EmptyState title="No teams yet" subtitle="Create your first team to get started." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teams.map((t) => (
                <Link key={t.id} href={`/org/${orgId}/teams/${t.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardBody>
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      <p className="text-sm text-slate-500">
                        {t.sport} {t.ageGroup ? `· ${t.ageGroup}` : ""} {t.gender ? `· ${t.gender}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">{t._count.memberships} members</p>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {canManage && (
          <Card className="self-start">
            <CardHeader title="New team" />
            <CardBody>
              <form action={createTeamAction.bind(null, orgId)} className="space-y-3">
                <Field label="Team name">
                  <Input name="name" required placeholder="e.g. U16 Boys Hockey" />
                </Field>
                <Field label="Sport">
                  <Input name="sport" required placeholder="e.g. Hockey" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age group">
                    <Input name="ageGroup" placeholder="U16" />
                  </Field>
                  <Field label="Gender">
                    <Select name="gender" defaultValue="">
                      <option value="">Mixed</option>
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Season">
                  <Input name="season" placeholder="2026" />
                </Field>
                <Button type="submit" className="w-full">
                  Create team
                </Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
