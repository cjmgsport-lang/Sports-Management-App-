import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { MorphocycleStrip } from "@/components/morphocycle-strip";
import { MorphocycleSessionFields } from "@/components/morphocycle-session-fields";
import { addSessionDrillAction, createTrainingSessionAction } from "@/lib/actions/training-plans";
import { MATCH_DAY_LABELS, MOMENT_COLORS, MOMENT_SHORT_LABELS, SUB_DYNAMIC_LABELS, matchDaySortIndex } from "@/lib/tactical-periodization";
import { format } from "date-fns";

export default async function MicrocyclePage({
  params,
}: {
  params: Promise<{ orgId: string; microcycleId: string }>;
}) {
  const { orgId, microcycleId } = await params;
  await requireOrgMembership(orgId);

  const microcycle = await db.microcycle.findFirst({
    where: { id: microcycleId, mesocycle: { macrocycle: { season: { organizationId: orgId } } } },
    include: {
      team: true,
      fixture: true,
      mesocycle: { include: { macrocycle: { include: { season: true } } } },
      sessions: {
        orderBy: { date: "asc" },
        include: { drills: { include: { drill: true }, orderBy: { orderIndex: "asc" } }, uploads: true },
      },
    },
  });
  if (!microcycle) notFound();

  const drills = await db.drill.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
  const season = microcycle.mesocycle.macrocycle.season;
  const sortedSessions = [...microcycle.sessions].sort((a, b) => matchDaySortIndex(a.matchDayCode) - matchDaySortIndex(b.matchDayCode));

  return (
    <div>
      <PageHeader
        title={`Week ${microcycle.weekNumber}${microcycle.theme ? ` · ${microcycle.theme}` : ""}`}
        subtitle={`${microcycle.team.name} · ${format(microcycle.startDate, "d MMM")} – ${format(microcycle.endDate, "d MMM yyyy")}${
          microcycle.fixture ? ` · Building toward vs ${microcycle.fixture.opponent} (${format(microcycle.fixture.startsAt, "d MMM")})` : ""
        }`}
        action={
          <Link href={`/org/${orgId}/training-plans/${season.id}`} className="text-sm text-brand-600 hover:underline">
            ← Back to {season.name}
          </Link>
        }
      />

      {microcycle.notes && <p className="mb-4 text-sm text-slate-500">{microcycle.notes}</p>}

      <Card className="mb-6">
        <CardHeader title="Morphocycle" subtitle="The standard weekly structure, built backward from the next match." />
        <CardBody>
          <MorphocycleStrip sessions={microcycle.sessions} />
        </CardBody>
      </Card>

      <div className="space-y-4">
        {microcycle.sessions.length === 0 && <EmptyState title="No sessions yet" subtitle="Add this week's first training session below." />}

        {sortedSessions.map((s) => (
          <Card key={s.id}>
            <CardHeader
              title={`${format(s.date, "EEE d MMM")} · ${s.focus}`}
              subtitle={`${s.startTime ?? ""}${s.endTime ? `–${s.endTime}` : ""} ${s.location ? `· ${s.location}` : ""}`}
              action={
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {s.matchDayCode && <Badge color="slate">{MATCH_DAY_LABELS[s.matchDayCode as keyof typeof MATCH_DAY_LABELS]}</Badge>}
                  {s.dominantMoment && (
                    <Badge color={MOMENT_COLORS[s.dominantMoment as keyof typeof MOMENT_COLORS]}>
                      {MOMENT_SHORT_LABELS[s.dominantMoment as keyof typeof MOMENT_SHORT_LABELS]}
                    </Badge>
                  )}
                  {s.subDynamic && <Badge color="amber">{SUB_DYNAMIC_LABELS[s.subDynamic as keyof typeof SUB_DYNAMIC_LABELS]}</Badge>}
                  {s.intensityRpe && <Badge color="amber">RPE {s.intensityRpe}</Badge>}
                </div>
              }
            />
            <CardBody>
              {s.notes && <p className="mb-3 text-sm text-slate-500">{s.notes}</p>}

              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Drills</p>
              {s.drills.length === 0 ? (
                <p className="mb-3 text-sm text-slate-400">No drills added.</p>
              ) : (
                <ol className="mb-3 space-y-1 text-sm">
                  {s.drills.map((sd) => (
                    <li key={sd.id} className="flex justify-between rounded border border-slate-100 px-3 py-1.5">
                      <span>{sd.drill.name}</span>
                      <span className="text-slate-400">{sd.durationMin ? `${sd.durationMin} min` : ""}</span>
                    </li>
                  ))}
                </ol>
              )}

              {drills.length > 0 && (
                <form action={addSessionDrillAction.bind(null, orgId, microcycleId, s.id)} className="mb-3 flex flex-wrap items-end gap-2">
                  <select name="drillId" required className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                    {drills.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <Input name="durationMin" type="number" min={1} placeholder="Min" className="w-20" />
                  <Button type="submit" size="sm">
                    Add drill
                  </Button>
                </form>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400">
                  {s.uploads.length} file{s.uploads.length === 1 ? "" : "s"} attached (session animation, GPS, video, PDF)
                </p>
                <Link href={`/org/${orgId}/uploads?sessionId=${s.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                  Manage files →
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}

        <Card>
          <CardHeader title="New session" subtitle="Give the day its morphocycle identity — a match-day code, dominant moment and sub-dynamic." />
          <CardBody>
            <form action={createTrainingSessionAction.bind(null, orgId, microcycleId)} className="grid gap-3 sm:grid-cols-3">
              <Field label="Date">
                <Input type="date" name="date" required />
              </Field>
              <Field label="Start time">
                <Input type="time" name="startTime" />
              </Field>
              <Field label="End time">
                <Input type="time" name="endTime" />
              </Field>
              <MorphocycleSessionFields />
              <Field label="Focus">
                <Input name="focus" required placeholder="e.g. Build-up through wide areas vs mid-block" className="sm:col-span-2" />
              </Field>
              <Field label="RPE (1-10)">
                <Input type="number" name="intensityRpe" min={1} max={10} />
              </Field>
              <Field label="Location">
                <Input name="location" placeholder="Field 1" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <Textarea name="notes" rows={2} />
                </Field>
              </div>
              <Button type="submit" className="self-end">
                Add session
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
