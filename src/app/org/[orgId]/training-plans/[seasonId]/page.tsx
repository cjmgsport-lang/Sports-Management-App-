import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { createMacrocycleAction, createMesocycleAction, createMicrocycleAction } from "@/lib/actions/training-plans";
import { format } from "date-fns";

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ orgId: string; seasonId: string }>;
}) {
  const { orgId, seasonId } = await params;
  await requireOrgMembership(orgId);

  const season = await db.season.findFirst({
    where: { id: seasonId, organizationId: orgId },
    include: {
      team: true,
      macrocycles: {
        orderBy: { startDate: "asc" },
        include: {
          mesocycles: {
            orderBy: { startDate: "asc" },
            include: {
              microcycles: {
                orderBy: { weekNumber: "asc" },
                include: { _count: { select: { sessions: true } }, fixture: true },
              },
            },
          },
        },
      },
    },
  });
  if (!season) notFound();

  const upcomingFixtures = await db.fixture.findMany({
    where: { teamId: season.teamId, status: "SCHEDULED" },
    orderBy: { startsAt: "asc" },
    take: 12,
  });

  return (
    <div>
      <PageHeader
        title={season.name}
        subtitle={`${season.team.name} · ${format(season.startDate, "d MMM yyyy")} – ${format(season.endDate, "d MMM yyyy")}`}
      />

      <div className="space-y-6">
        {season.macrocycles.map((macro) => (
          <Card key={macro.id}>
            <CardHeader title={macro.name} subtitle={macro.focus ?? undefined} />
            <CardBody>
              <p className="mb-3 text-xs text-slate-400">
                {format(macro.startDate, "d MMM")} – {format(macro.endDate, "d MMM yyyy")}
              </p>

              <div className="space-y-4">
                {macro.mesocycles.map((meso) => (
                  <div key={meso.id} className="rounded-lg border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{meso.name}</p>
                        <p className="text-xs text-slate-400">
                          {meso.focus ?? "No principles specified yet"} · {format(meso.startDate, "d MMM")} – {format(meso.endDate, "d MMM yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {meso.microcycles.map((micro) => (
                        <Link
                          key={micro.id}
                          href={`/org/${orgId}/training-plans/microcycle/${micro.id}`}
                          className="rounded-lg border border-slate-100 px-3 py-2 text-sm hover:border-brand-300 hover:bg-brand-50"
                        >
                          <p className="font-medium text-slate-800">
                            Week {micro.weekNumber} {micro.theme ? `· ${micro.theme}` : ""}
                          </p>
                          <p className="text-xs text-slate-400">
                            {format(micro.startDate, "d MMM")} – {format(micro.endDate, "d MMM")} · {micro._count.sessions} sessions
                          </p>
                          {micro.fixture && (
                            <p className="text-xs text-brand-600">
                              Building toward: vs {micro.fixture.opponent} ({format(micro.fixture.startsAt, "d MMM")})
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-brand-600">+ Add weekly morphocycle</summary>
                      <form
                        action={createMicrocycleAction.bind(null, orgId, seasonId, meso.id, season.teamId)}
                        className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6"
                      >
                        <Input name="weekNumber" type="number" min={1} placeholder="Week #" required className="col-span-1" />
                        <Input name="startDate" type="date" required className="col-span-1" />
                        <Input name="endDate" type="date" required className="col-span-1" />
                        <Input name="theme" placeholder="Theme (e.g. Speed)" className="col-span-1" />
                        <select name="fixtureId" defaultValue="" className="col-span-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                          <option value="">No fixture</option>
                          {upcomingFixtures.map((f) => (
                            <option key={f.id} value={f.id}>
                              vs {f.opponent} ({format(f.startsAt, "d MMM")})
                            </option>
                          ))}
                        </select>
                        <Button type="submit" size="sm" className="col-span-1">
                          Add
                        </Button>
                      </form>
                    </details>
                  </div>
                ))}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-medium text-brand-600">+ Add mesocycle to {macro.name}</summary>
                <form
                  action={createMesocycleAction.bind(null, orgId, seasonId, macro.id)}
                  className="mt-2 grid gap-2 sm:grid-cols-4"
                >
                  <Input name="name" placeholder="Mesocycle name" required />
                  <Input name="focus" placeholder="e.g. Mid-block press + build-up through wide areas" />
                  <Input name="startDate" type="date" required />
                  <div className="flex gap-2">
                    <Input name="endDate" type="date" required />
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                  </div>
                </form>
              </details>
            </CardBody>
          </Card>
        ))}

        <Card>
          <CardHeader
            title="New macrocycle"
            subtitle="A macrocycle is a phase of the season defined by which game-model principles it introduces or consolidates — not by physical qualities."
          />
          <CardBody>
            <form action={createMacrocycleAction.bind(null, orgId, seasonId)} className="grid gap-3 sm:grid-cols-4">
              <Field label="Name">
                <Input name="name" required placeholder="Pre-season" />
              </Field>
              <Field label="Focus">
                <Input name="focus" placeholder="e.g. Introduce defensive organization principles" />
              </Field>
              <Field label="Start date">
                <Input type="date" name="startDate" required />
              </Field>
              <Field label="End date">
                <Input type="date" name="endDate" required />
              </Field>
              <Button type="submit" className="sm:col-span-4">
                Add macrocycle
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
