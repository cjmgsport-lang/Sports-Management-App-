import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { TeamFilter } from "@/components/team-filter";
import { createPrincipleAction, deletePrincipleAction } from "@/lib/actions/game-model";
import { MOMENT_COLORS, MOMENT_LABELS, MOMENTS } from "@/lib/tactical-periodization";
import { isAdmin } from "@/lib/roles";

export default async function GameModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ teamId?: string }>;
}) {
  const { orgId } = await params;
  const { teamId } = await searchParams;
  const { membership } = await requireOrgMembership(orgId);

  const teams = await db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
  const activeTeamId = teamId ?? teams[0]?.id;

  const principles = activeTeamId
    ? await db.gamePrinciple.findMany({ where: { teamId: activeTeamId }, orderBy: [{ moment: "asc" }, { orderIndex: "asc" }] })
    : [];

  const canEdit = isAdmin(membership.role) || membership.role === "COACH" || membership.role === "ASSISTANT_COACH" || membership.role === "MANAGER";

  return (
    <div>
      <PageHeader
        title="Game Model"
        subtitle="How this team wants to play — the principles every drill and session should serve, organised by the four moments of the game."
        action={<TeamFilter teams={teams} current={activeTeamId} />}
      />

      {!activeTeamId ? (
        <EmptyState title="No teams yet" subtitle="Create a team first, then define its game model." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {MOMENTS.map((moment) => {
              const items = principles.filter((p) => p.moment === moment);
              return (
                <Card key={moment}>
                  <CardHeader title={MOMENT_LABELS[moment]} action={<Badge color={MOMENT_COLORS[moment]}>{items.length}</Badge>} />
                  <CardBody>
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-400">No principles defined yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((p) => (
                          <li key={p.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{p.name}</p>
                              {p.description && <p className="text-sm text-slate-500">{p.description}</p>}
                            </div>
                            {canEdit && (
                              <form action={deletePrincipleAction.bind(null, orgId, p.id)}>
                                <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                              </form>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {canEdit && (
            <Card className="self-start">
              <CardHeader title="Add principle" subtitle="A concrete, observable behaviour — not a physical quality." />
              <CardBody>
                <form action={createPrincipleAction.bind(null, orgId)} className="space-y-3">
                  <input type="hidden" name="teamId" value={activeTeamId} />
                  <Field label="Moment of the game">
                    <Select name="moment" defaultValue={MOMENTS[0]}>
                      {MOMENTS.map((m) => (
                        <option key={m} value={m}>
                          {MOMENT_LABELS[m]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Principle">
                    <Input name="name" required placeholder="e.g. Build-up through the wide areas" />
                  </Field>
                  <Field label="Description">
                    <Textarea name="description" rows={3} placeholder="What should this look like on the pitch?" />
                  </Field>
                  <Button type="submit" className="w-full">
                    Add principle
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
