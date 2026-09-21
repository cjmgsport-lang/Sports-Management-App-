import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { recordResultAction } from "@/lib/actions/fixtures";
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
    include: { team: true, tournament: true, result: true, uploads: true },
  });
  if (!fixture) notFound();

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
      </div>
    </div>
  );
}
