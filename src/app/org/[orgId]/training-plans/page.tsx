import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { createSeasonAction, createDrillAction } from "@/lib/actions/training-plans";
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
  const drills = await db.drill.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        title="Periodised Training Plans"
        subtitle="Season macrocycles, mesocycles and weekly microcycles, right down to individual sessions."
      />

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
            <CardHeader title="Drill library" subtitle="Reusable drills you can add to any training session." />
            <CardBody>
              {drills.length === 0 ? (
                <p className="text-sm text-slate-400">No drills yet — add some using the form.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {drills.map((d) => (
                    <li key={d.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <p className="font-medium text-slate-800">{d.name}</p>
                      <p className="text-slate-400">
                        {d.category ?? "General"} {d.durationMin ? `· ${d.durationMin} min` : ""}
                      </p>
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
            <CardHeader title="New drill" />
            <CardBody>
              <form action={createDrillAction.bind(null, orgId)} className="space-y-3">
                <Field label="Name">
                  <Input name="name" required placeholder="Small-sided possession" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <Input name="category" placeholder="Tactical" />
                  </Field>
                  <Field label="Duration (min)">
                    <Input type="number" name="durationMin" min={1} />
                  </Field>
                </div>
                <Field label="Equipment">
                  <Input name="equipment" placeholder="Cones, poles, mannequins" />
                </Field>
                <Field label="Description">
                  <Textarea name="description" rows={2} />
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
