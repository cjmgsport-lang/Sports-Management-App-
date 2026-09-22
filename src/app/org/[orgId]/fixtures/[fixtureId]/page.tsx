import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { recordResultAction } from "@/lib/actions/fixtures";
import { addCardAction, addGoalAction, deleteCardAction, deleteGoalAction } from "@/lib/actions/match-detail";
import { format } from "date-fns";

export default async function FixtureDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; fixtureId: string }>;
}) {
  const { orgId, fixtureId } = await params;
  await requireOrgMembership(orgId);

  const fixture = await db.fixture.findFirst({
    where: { id: fixtureId, organizationId: orgId },
    include: {
      team: { include: { memberships: { where: { role: "ATHLETE" }, include: { user: true } } } },
      tournament: true,
      result: true,
      uploads: true,
      goals: { include: { scorer: true }, orderBy: { minute: "asc" } },
      cards: { include: { player: true }, orderBy: { minute: "asc" } },
    },
  });
  if (!fixture) notFound();

  const roster = fixture.team.memberships;

  return (
    <div>
      <PageHeader
        title={`${fixture.team.name} vs ${fixture.opponent}`}
        subtitle={`${format(fixture.startsAt, "EEE d MMM yyyy, HH:mm")} · ${fixture.homeAway}${fixture.venue ? ` · ${fixture.venue}` : ""}`}
        action={<Badge color={fixture.status === "COMPLETED" ? "green" : "blue"}>{fixture.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Result" />
          <CardBody>
            {fixture.result ? (
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {fixture.ourScore} – {fixture.opponentScore}
                </p>
                {fixture.result.summary && <p className="mt-2 text-sm text-slate-600">{fixture.result.summary}</p>}
                {fixture.result.statsJson && (
                  <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-500">{fixture.result.statsJson}</pre>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No result recorded yet.</p>
            )}

            <form action={recordResultAction.bind(null, orgId, fixture.id)} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Our score">
                  <Input type="number" name="ourScore" min={0} defaultValue={fixture.ourScore ?? undefined} required />
                </Field>
                <Field label="Opponent score">
                  <Input type="number" name="opponentScore" min={0} defaultValue={fixture.opponentScore ?? undefined} required />
                </Field>
              </div>
              <Field label="Summary">
                <Textarea name="summary" rows={3} defaultValue={fixture.result?.summary ?? ""} placeholder="Match summary / key moments" />
              </Field>
              <Field label="Stats (JSON or free text)">
                <Textarea name="statsJson" rows={3} defaultValue={fixture.result?.statsJson ?? ""} placeholder="Possession, shots, cards, etc." />
              </Field>
              <Button type="submit" className="w-full">
                {fixture.result ? "Update result" : "Record result"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Files" subtitle="Match video, GPS data and PDFs for this fixture." />
          <CardBody>
            {fixture.uploads.length === 0 ? (
              <p className="text-sm text-slate-400">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {fixture.uploads.map((u) => (
                  <li key={u.id} className="flex justify-between">
                    <span>{u.filename}</span>
                    <Badge>{u.kind}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/org/${orgId}/uploads?fixtureId=${fixture.id}`}
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              Manage files →
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Goals & goalscorers" />
          <CardBody>
            {fixture.goals.length === 0 ? (
              <p className="mb-3 text-sm text-slate-400">No goals recorded yet.</p>
            ) : (
              <ul className="mb-3 divide-y divide-slate-100">
                {fixture.goals.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-800">{g.scorer.name}</span>
                      {g.minute != null && <span className="text-slate-400"> · {g.minute}&apos;</span>}
                      {g.ownGoal && <Badge color="amber" className="ml-2">Own goal</Badge>}
                    </div>
                    <form action={deleteGoalAction.bind(null, orgId, fixture.id, g.id)}>
                      <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            {roster.length > 0 && (
              <form action={addGoalAction.bind(null, orgId, fixture.id)} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                <Select name="scorerId" required className="flex-1">
                  {roster.map((r) => (
                    <option key={r.userId} value={r.userId}>
                      {r.user.name}
                    </option>
                  ))}
                </Select>
                <Input type="number" name="minute" min={0} max={150} placeholder="Min" className="w-20" />
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <input type="checkbox" name="ownGoal" className="h-3.5 w-3.5 rounded border-slate-300" />
                  Own goal
                </label>
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cards" />
          <CardBody>
            {fixture.cards.length === 0 ? (
              <p className="mb-3 text-sm text-slate-400">No cards recorded yet.</p>
            ) : (
              <ul className="mb-3 divide-y divide-slate-100">
                {fixture.cards.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-800">{c.player.name}</span>
                      {c.minute != null && <span className="text-slate-400"> · {c.minute}&apos;</span>}
                      <Badge color={c.cardType === "RED" ? "red" : "amber"} className="ml-2">
                        {c.cardType}
                      </Badge>
                    </div>
                    <form action={deleteCardAction.bind(null, orgId, fixture.id, c.id)}>
                      <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            {roster.length > 0 && (
              <form action={addCardAction.bind(null, orgId, fixture.id)} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                <Select name="playerId" required className="flex-1">
                  {roster.map((r) => (
                    <option key={r.userId} value={r.userId}>
                      {r.user.name}
                    </option>
                  ))}
                </Select>
                <Select name="cardType" defaultValue="YELLOW" className="w-28">
                  <option value="YELLOW">Yellow</option>
                  <option value="RED">Red</option>
                </Select>
                <Input type="number" name="minute" min={0} max={150} placeholder="Min" className="w-20" />
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
