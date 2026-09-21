import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import { createSeasonAction, createDrillAction } from "@/lib/actions/training-plans";
import { COMPLEXITY_LABELS, COMPLEXITIES, MOMENT_COLORS, MOMENT_SHORT_LABELS, MOMENTS } from "@/lib/tactical-periodization";
import { format } from "date-fns";

export default async function TrainingPlansPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const teams = await db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
  const seasons = await db.season.findMany({
    where: { organizationId: orgId },
    include: { team: true, macrocycles: { include: { mesocycles: { include: { microcycles: true } } } } },
    orderBy: { startDate: "desc" },
  });
  const drills = await db.drill.findMany({
    where: { organizationId: orgId },
    include: { principle: true },
    orderBy: { name: "asc" },
  });
  const principles = await db.gamePrinciple.findMany({
    where: { team: { organizationId: orgId } },
    include: { team: true },
    orderBy: [{ team: { name: "asc" } }, { moment: "asc" }, { orderIndex: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Periodised Training Plans"
        subtitle="Built on tactical periodisation: macrocycles and mesocycles introduce game-model principles, weekly microcycles are morphocycles built backward from the next match."
        action={<LinkButton href={`/org/${orgId}/game-model`} variant="secondary">Game Model</LinkButton>}
      />
      {principles.length === 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No game model defined yet. <Link href={`/org/${orgId}/game-model`} className="font-medium underline">Define your principles of play</Link> first — every drill below should serve one of them.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {seasons.length === 0 ? (
            <EmptyState title="No seasons yet" subtitle="Create a season to start building a periodised plan." />
          ) : (
            seasons.map((s) => {
              const microCount = s.macrocycles.reduce(
                (acc, m) => acc + m.mesocycles.reduce((a, me) => a + me.microcycles.length, 0),
                0
              );
              return (
                <Link key={s.id} href={`/org/${orgId}/training-plans/${s.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardBody className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="text-sm text-slate-500">
                          {s.team.name} · {format(s.startDate, "d MMM yyyy")} – {format(s.endDate, "d MMM yyyy")}
                        </p>
                      </div>
                      <p className="text-sm text-slate-400">
                        {s.macrocycles.length} macrocycles · {microCount} weeks planned
                      </p>
                    </CardBody>
                  </Card>
                </Link>
              );
            })
          )}

          <Card>
            <CardHeader title="Drill library" subtitle="Every exercise should be designed to propensiate one game-model principle — never decontextualised physical training." />
            <CardBody>
              {drills.length === 0 ? (
                <p className="text-sm text-slate-400">No drills yet — add some using the form.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {drills.map((d) => (
                    <li key={d.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <p className="font-medium text-slate-800">{d.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {d.moment && <Badge color={MOMENT_COLORS[d.moment as keyof typeof MOMENT_COLORS]}>{MOMENT_SHORT_LABELS[d.moment as keyof typeof MOMENT_SHORT_LABELS]}</Badge>}
                        {d.complexity && <Badge>{COMPLEXITY_LABELS[d.complexity as keyof typeof COMPLEXITY_LABELS]}</Badge>}
                        {d.durationMin && <Badge color="slate">{d.durationMin} min</Badge>}
                      </div>
                      {d.principle && <p className="mt-1 text-xs text-slate-500">Targets: {d.principle.name}</p>}
                      {d.constraints && <p className="mt-1 text-xs text-slate-400">{d.constraints}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="New season" />
            <CardBody>
              <form action={createSeasonAction.bind(null, orgId)} className="space-y-3">
                <Field label="Team">
                  <Select name="teamId" required>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Season name">
                  <Input name="name" required placeholder="2026 Season" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start date">
                    <Input type="date" name="startDate" required />
                  </Field>
                  <Field label="End date">
                    <Input type="date" name="endDate" required />
                  </Field>
                </div>
                <Button type="submit" className="w-full">
                  Create season
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="New drill" subtitle="Tag it with the moment and principle it's designed to develop." />
            <CardBody>
              <form action={createDrillAction.bind(null, orgId)} className="space-y-3">
                <Field label="Name">
                  <Input name="name" required placeholder="4v4+2 possession, switch to press" />
                </Field>
                <Field label="Moment of the game">
                  <Select name="moment" defaultValue="">
                    <option value="">— Not tagged —</option>
                    {MOMENTS.map((m) => (
                      <option key={m} value={m}>
                        {MOMENT_SHORT_LABELS[m]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Principle it targets">
                  <Select name="principleId" defaultValue="">
                    <option value="">— None —</option>
                    {teams.map((t) => {
                      const teamPrinciples = principles.filter((p) => p.teamId === t.id);
                      if (teamPrinciples.length === 0) return null;
                      return (
                        <optgroup key={t.id} label={t.name}>
                          {teamPrinciples.map((p) => (
                            <option key={p.id} value={p.id}>
                              {MOMENT_SHORT_LABELS[p.moment as keyof typeof MOMENT_SHORT_LABELS]} · {p.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Complexity">
                    <Select name="complexity" defaultValue="">
                      <option value="">—</option>
                      {COMPLEXITIES.map((c) => (
                        <option key={c} value={c}>
                          {COMPLEXITY_LABELS[c]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Duration (min)">
                    <Input type="number" name="durationMin" min={1} />
                  </Field>
                </div>
                <Field label="Constraints">
                  <Input name="constraints" placeholder="e.g. 4v4+2 GKs, 30x20m, max 3 touches" />
                </Field>
                <Field label="Equipment">
                  <Input name="equipment" placeholder="Cones, poles, mannequins" />
                </Field>
                <Field label="Description">
                  <Textarea name="description" rows={2} placeholder="What behaviour should emerge?" />
                </Field>
                <Button type="submit" className="w-full">
                  Add drill
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
