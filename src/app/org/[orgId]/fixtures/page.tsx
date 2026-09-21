import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { createFixtureAction, createFixtureTemplateAction } from "@/lib/actions/fixtures";
import { format } from "date-fns";

const STATUS_COLOR: Record<string, "blue" | "green" | "amber" | "red"> = {
  SCHEDULED: "blue",
  COMPLETED: "green",
  POSTPONED: "amber",
  CANCELED: "red",
};

export default async function FixturesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const [teams, tournaments, templates, fixtures] = await Promise.all([
    db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    db.tournament.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    db.fixtureTemplate.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    db.fixture.findMany({
      where: { organizationId: orgId },
      include: { team: true, tournament: true },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Fixtures & Results" subtitle="Schedule fixtures and record results." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {fixtures.length === 0 ? (
            <EmptyState title="No fixtures yet" subtitle="Schedule your first fixture using the form." />
          ) : (
            fixtures.map((f) => (
              <Link key={f.id} href={`/org/${orgId}/fixtures/${f.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {f.team.name} vs {f.opponent}
                        </p>
                        <Badge color={STATUS_COLOR[f.status]}>{f.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {format(f.startsAt, "EEE d MMM yyyy, HH:mm")} · {f.homeAway}
                        {f.venue ? ` · ${f.venue}` : ""}
                        {f.tournament ? ` · ${f.tournament.name}` : ""}
                      </p>
                    </div>
                    {f.status === "COMPLETED" && (
                      <p className="text-lg font-semibold text-slate-800">
                        {f.ourScore} – {f.opponentScore}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Link>
            ))
          )}

          <Card>
            <CardHeader title="Fixture templates" subtitle="Reusable defaults for recurring fixture types." />
            <CardBody>
              {templates.length > 0 && (
                <ul className="mb-3 space-y-1 text-sm text-slate-600">
                  {templates.map((t) => (
                    <li key={t.id}>
                      {t.name} — {t.sport} {t.defaultVenue ? `· ${t.defaultVenue}` : ""}
                    </li>
                  ))}
                </ul>
              )}
              <form action={createFixtureTemplateAction.bind(null, orgId)} className="grid gap-2 sm:grid-cols-4">
                <Input name="name" placeholder="Template name" required />
                <Input name="sport" placeholder="Sport" required />
                <Input name="defaultVenue" placeholder="Default venue" />
                <Button type="submit" size="sm">
                  Add template
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="New fixture" />
          <CardBody>
            <form action={createFixtureAction.bind(null, orgId)} className="space-y-3">
              <Field label="Team">
                <Select name="teamId" required>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Opponent">
                <Input name="opponent" required placeholder="e.g. King Edward VII" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Home/Away">
                  <Select name="homeAway" defaultValue="HOME">
                    <option value="HOME">Home</option>
                    <option value="AWAY">Away</option>
                    <option value="NEUTRAL">Neutral</option>
                  </Select>
                </Field>
                <Field label="Kickoff">
                  <Input type="datetime-local" name="startsAt" required />
                </Field>
              </div>
              <Field label="Venue">
                <Input name="venue" placeholder="Home ground" />
              </Field>
              {tournaments.length > 0 && (
                <Field label="Tournament (optional)">
                  <Select name="tournamentId" defaultValue="">
                    <option value="">None</option>
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {templates.length > 0 && (
                <Field label="Template (optional)">
                  <Select name="templateId" defaultValue="">
                    <option value="">None</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="Notes">
                <Textarea name="notes" rows={2} />
              </Field>
              <Button type="submit" className="w-full">
                Schedule fixture
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
