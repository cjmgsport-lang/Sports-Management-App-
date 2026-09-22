import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { seedPlanningCalendarAction } from "@/lib/actions/calendar";
import { generateMicrocycleFromTemplateAction } from "@/lib/actions/training-plans";
import { isAdmin, canCoach } from "@/lib/roles";
import { MICROCYCLE_TEMPLATES, type MicrocycleTemplateId } from "@/lib/tactical-periodization";
import { PLANNING_CALENDAR_YEARS } from "@/lib/sa-calendar";
import { format } from "date-fns";

export default async function AdministrationPlanningPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const [planningEventCount, mesocycles, nextPlanningEvents] = await Promise.all([
    db.calendarEvent.count({ where: { organizationId: orgId } }),
    db.mesocycle.findMany({
      where: { macrocycle: { season: { organizationId: orgId } } },
      include: { macrocycle: { include: { season: { include: { team: true } } } } },
      orderBy: { startDate: "asc" },
    }),
    db.calendarEvent.findMany({
      where: { organizationId: orgId, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 8,
    }),
  ]);

  const canManage = isAdmin(membership.role);
  const canPlan = canCoach(membership.role);

  return (
    <div>
      <PageHeader title="Planning" subtitle="The 5-year planning calendar, the tactical periodisation template, and microcycle generation." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="5-year planning calendar"
            subtitle={`South African public holidays and approximate school/university terms, ${PLANNING_CALENDAR_YEARS[0]}–${PLANNING_CALENDAR_YEARS[PLANNING_CALENDAR_YEARS.length - 1]}.`}
          />
          <CardBody>
            <p className="text-sm text-slate-500">
              {planningEventCount > 0 ? `${planningEventCount} events currently seeded.` : "Not generated yet."}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {nextPlanningEvents.map((e) => (
                <li key={e.id} className="flex justify-between rounded-lg border border-slate-100 px-3 py-1.5">
                  <span className="font-medium text-slate-800">{e.title}</span>
                  <span className="text-slate-400">{format(e.startsAt, "d MMM yyyy")}</span>
                </li>
              ))}
              {nextPlanningEvents.length === 0 && <li className="text-slate-400">No upcoming planning events yet.</li>}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <Link href={`/org/${orgId}/calendar`} className="text-sm font-medium text-brand-600 hover:underline">
                View on Calendar →
              </Link>
              {canManage && (
                <form action={seedPlanningCalendarAction.bind(null, orgId)}>
                  <Button type="submit" size="sm" variant="secondary">
                    {planningEventCount > 0 ? "Regenerate" : "Generate"} 5-year calendar
                  </Button>
                </form>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tactical periodisation template" subtitle="The team's Game Model is the template every microcycle and drill is built against." />
          <CardBody>
            <p className="text-sm text-slate-500">
              Principles of play under the four moments of the game, plus set pieces — defined once per team, then referenced everywhere in
              training.
            </p>
            <Link href={`/org/${orgId}/game-model`} className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
              Open Game Model →
            </Link>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Generate a microcycle from a template"
            subtitle="Pick the fixture pattern for the week — the morphocycle (MD-codes, sub-dynamics) is built backward from the match date automatically."
          />
          <CardBody>
            {mesocycles.length === 0 ? (
              <p className="text-sm text-slate-400">
                No mesocycles yet.{" "}
                <Link href={`/org/${orgId}/training-plans`} className="font-medium text-brand-600 hover:underline">
                  Create a season, macrocycle and mesocycle first
                </Link>
                , then come back here to generate weeks from a template.
              </p>
            ) : canPlan ? (
              <form action={generateMicrocycleFromTemplateAction.bind(null, orgId)} className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <Field label="Mesocycle">
                    <Select name="mesocycleId" required>
                      {mesocycles.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.macrocycle.season.team.name} — {m.macrocycle.season.name} — {m.macrocycle.name} — {m.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Fixture pattern">
                    <Select name="templateId" defaultValue="SINGLE_SATURDAY">
                      {(
                        Object.entries(MICROCYCLE_TEMPLATES) as [MicrocycleTemplateId, (typeof MICROCYCLE_TEMPLATES)[MicrocycleTemplateId]][]
                      ).map(([id, t]) => (
                        <option key={id} value={id}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Week number">
                  <Input type="number" name="weekNumber" min={1} defaultValue={1} required />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="First match date">
                    <Input type="date" name="firstMatchDate" required />
                  </Field>
                </div>
                <Field label="Theme (optional)">
                  <Input name="theme" placeholder="Defaults to the pattern name" />
                </Field>
                <div className="sm:col-span-3">
                  <Button type="submit">Generate microcycle</Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-400">You don&apos;t have permission to generate training plans.</p>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
              {(Object.values(MICROCYCLE_TEMPLATES) as (typeof MICROCYCLE_TEMPLATES)[MicrocycleTemplateId][]).map((t) => (
                <Badge key={t.label} color="slate">
                  {t.label}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
