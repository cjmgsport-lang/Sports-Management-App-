import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Card, CardBody, CardHeader, EmptyState, Field, Button, Input, PageHeader, Textarea } from "@/components/ui";
import { createTournamentAction } from "@/lib/actions/fixtures";
import { format } from "date-fns";

export default async function TournamentsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const tournaments = await db.tournament.findMany({
    where: { organizationId: orgId },
    include: { _count: { select: { fixtures: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <div>
      <PageHeader title="Tournaments" subtitle="Manage tournaments and see which fixtures belong to each." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {tournaments.length === 0 ? (
            <EmptyState title="No tournaments yet" subtitle="Create a tournament to group fixtures together." />
          ) : (
            tournaments.map((t) => (
              <Card key={t.id}>
                <CardBody>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">
                    {format(t.startDate, "d MMM")} – {format(t.endDate, "d MMM yyyy")} {t.venue ? `· ${t.venue}` : ""}
                  </p>
                  {t.format && <p className="mt-1 text-sm text-slate-500">Format: {t.format}</p>}
                  {t.description && <p className="mt-1 text-sm text-slate-400">{t.description}</p>}
                  <p className="mt-2 text-xs text-slate-400">{t._count.fixtures} fixtures</p>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="New tournament" />
          <CardBody>
            <form action={createTournamentAction.bind(null, orgId)} className="space-y-3">
              <Field label="Name">
                <Input name="name" required placeholder="Interschools Festival" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date">
                  <Input type="date" name="startDate" required />
                </Field>
                <Field label="End date">
                  <Input type="date" name="endDate" required />
                </Field>
              </div>
              <Field label="Venue">
                <Input name="venue" placeholder="St John's College" />
              </Field>
              <Field label="Format">
                <Input name="format" placeholder="Round robin, then knockout" />
              </Field>
              <Field label="Description">
                <Textarea name="description" rows={2} />
              </Field>
              <Button type="submit" className="w-full">
                Create tournament
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
