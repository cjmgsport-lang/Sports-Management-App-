import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { TeamFilter } from "@/components/team-filter";
import { createEventAction, deleteEventAction } from "@/lib/actions/calendar";
import { format } from "date-fns";

const TYPE_COLORS: Record<string, "blue" | "green" | "amber" | "purple" | "slate" | "red"> = {
  TRAINING: "blue",
  MATCH: "green",
  MEETING: "amber",
  TRAVEL: "purple",
  TOURNAMENT: "red",
  OTHER: "slate",
};

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ teamId?: string }>;
}) {
  const { orgId } = await params;
  const { teamId } = await searchParams;
  await requireOrgMembership(orgId);

  const teams = await db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
  const events = await db.calendarEvent.findMany({
    where: { team: { organizationId: orgId }, ...(teamId ? { teamId } : {}) },
    include: { team: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Editable schedule of training, matches, meetings and travel." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Events" action={<TeamFilter teams={teams} current={teamId} />} />
            <CardBody className="p-0">
              {events.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No events" subtitle="Add your first calendar event using the form." />
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-start justify-between gap-3 px-5 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{e.title}</p>
                          <Badge color={TYPE_COLORS[e.type]}>{e.type}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {e.team.name} · {format(e.startsAt, "EEE d MMM yyyy, HH:mm")}–{format(e.endsAt, "HH:mm")}
                          {e.location ? ` · ${e.location}` : ""}
                        </p>
                        {e.description && <p className="mt-1 text-sm text-slate-400">{e.description}</p>}
                      </div>
                      <form action={deleteEventAction.bind(null, orgId, e.id)}>
                        <button className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="New event" />
          <CardBody>
            <form action={createEventAction.bind(null, orgId)} className="space-y-3">
              <Field label="Team">
                <Select name="teamId" required>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Title">
                <Input name="title" required placeholder="e.g. Tuesday field session" />
              </Field>
              <Field label="Type">
                <Select name="type" defaultValue="TRAINING">
                  <option value="TRAINING">Training</option>
                  <option value="MATCH">Match</option>
                  <option value="MEETING">Meeting</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="TOURNAMENT">Tournament</option>
                  <option value="OTHER">Other</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts">
                  <Input type="datetime-local" name="startsAt" required />
                </Field>
                <Field label="Ends">
                  <Input type="datetime-local" name="endsAt" required />
                </Field>
              </div>
              <Field label="Location">
                <Input name="location" placeholder="Field 2" />
              </Field>
              <Field label="Notes">
                <Textarea name="description" rows={2} />
              </Field>
              <Button type="submit" className="w-full">
                Add event
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
