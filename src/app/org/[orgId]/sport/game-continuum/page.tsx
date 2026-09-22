import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { updateGameContinuumMomentAction } from "@/lib/actions/game-continuum";
import { GAME_CONTINUUM_LABELS, GAME_CONTINUUM_MOMENTS } from "@/lib/game-continuum";
import { canCoach } from "@/lib/roles";

export default async function GameContinuumPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ teamId?: string }>;
}) {
  const { orgId } = await params;
  const { teamId: queryTeamId } = await searchParams;
  const { membership } = await requireOrgMembership(orgId);

  const teams = await db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
  if (teams.length === 0) {
    return (
      <div>
        <PageHeader title="Game Continuum" subtitle="The field spaces and moments of the game, illustrated per team." />
        <EmptyState title="No teams yet" subtitle="Create a team first, from Teams & Members." />
      </div>
    );
  }

  const teamId = queryTeamId ?? teams[0].id;
  const moments = await db.gameContinuumMoment.findMany({ where: { teamId } });
  const byMoment = new Map(moments.map((m) => [m.moment, m]));
  const canManage = canCoach(membership.role);

  return (
    <div>
      <PageHeader title="Game Continuum" subtitle="The field spaces and moments of the game, illustrated per team." />

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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_CONTINUUM_MOMENTS.map((momentId) => {
          const existing = byMoment.get(momentId);
          return (
            <Card key={momentId}>
              <CardHeader title={GAME_CONTINUUM_LABELS[momentId]} />
              <CardBody>
                {existing?.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/game-continuum-image/${existing.id}`}
                    alt={GAME_CONTINUUM_LABELS[momentId]}
                    className="mb-3 aspect-video w-full rounded-lg border border-slate-200 object-contain"
                  />
                ) : (
                  <div className="mb-3 flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                    No image yet
                  </div>
                )}
                {existing?.description && <p className="mb-3 text-sm text-slate-600">{existing.description}</p>}

                {canManage && (
                  <form
                    action={updateGameContinuumMomentAction.bind(null, orgId, teamId)}
                    className="space-y-2 border-t border-slate-100 pt-3"
                  >
                    <input type="hidden" name="moment" value={momentId} />
                    <Field label="Field-space image">
                      <Input type="file" name="image" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
                    </Field>
                    <Field label="Description">
                      <Textarea name="description" rows={2} defaultValue={existing?.description ?? ""} />
                    </Field>
                    <Button type="submit" size="sm" className="w-full">
                      Save
                    </Button>
                  </form>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
