import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { TeamFilter } from "@/components/team-filter";
import { createEventAction, deleteEventAction } from "@/lib/actions/calendar";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const TYPE_COLORS: Record<string, "blue" | "green" | "amber" | "purple" | "slate" | "red"> = {
  TRAINING: "blue",
  MATCH: "green",
  MEETING: "amber",
  TRAVEL: "purple",
  TOURNAMENT: "red",
  OTHER: "slate",
  PUBLIC_HOLIDAY: "red",
  SCHOOL_TERM: "blue",
  UNIVERSITY_TERM: "purple",
};

// Literal class strings (Tailwind can't see dynamically built ones) matching
// the Badge palette, for the small event chips in the month grid.
const CHIP_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
  slate: "bg-slate-100 text-slate-700",
};

// Events longer than this (school/university terms) would fill every cell of
// the month, so the grid only marks the days they start and end.
const LONG_EVENT_DAYS = 7;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ teamId?: string; view?: string; month?: string }>;
}) {
  const { orgId } = await params;
  const { teamId, view: viewParam, month } = await searchParams;
  await requireOrgMembership(orgId);

  const view = viewParam === "list" ? "list" : "month";
  const parsedMonth = month ? parse(month, "yyyy-MM", new Date()) : new Date();
  const monthStart = startOfMonth(isValid(parsedMonth) ? parsedMonth : new Date());
  // The grid shows whole weeks, Monday first, so it spills into the
  // neighbouring months.
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });

  const query = (overrides: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ teamId, view, month: format(monthStart, "yyyy-MM"), ...overrides })) if (v) qs.set(k, v);
    return `/org/${orgId}/calendar?${qs.toString()}`;
  };

  const teams = await db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } });
  // Month view only needs what overlaps the visible grid.
  const inGrid = view === "month" ? { startsAt: { lte: gridEnd }, endsAt: { gte: gridStart } } : {};
  const teamEvents = await db.calendarEvent.findMany({
    where: { team: { organizationId: orgId }, ...(teamId ? { teamId } : {}), ...inGrid },
    include: { team: true },
    orderBy: { startsAt: "asc" },
  });
  // Org-wide events (public holidays, school/university terms — seeded
  // under Administration > Planning) aren't team-scoped, so they're only
  // mixed in here when no team filter is active, and capped to the next
  // 90 days so five years of seeded rows don't swamp the day-to-day view —
  // the full 5-year run lives on the Planning page.
  const orgWideEvents = teamId
    ? []
    : await db.calendarEvent.findMany({
        where:
          view === "month"
            ? { organizationId: orgId, ...inGrid }
            : { organizationId: orgId, startsAt: { gte: new Date(), lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } },
        include: { team: true },
        orderBy: { startsAt: "asc" },
        ...(view === "month" ? {} : { take: 30 }),
      });
  const events = [...teamEvents, ...orgWideEvents].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);
  const eventsOn = (day: Date) =>
    events.filter((e) => {
      if (e.startsAt > endOfDay(day) || e.endsAt < startOfDay(day)) return false;
      if (differenceInCalendarDays(e.endsAt, e.startsAt) > LONG_EVENT_DAYS) {
        return isSameDay(e.startsAt, day) || isSameDay(e.endsAt, day);
      }
      return true;
    });

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Editable schedule of training, matches, meetings and travel."
        action={
          <Link href={`/org/${orgId}/administration/planning`} className="text-sm font-medium text-brand-600 hover:underline">
            5-year planning calendar →
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={view === "month" ? format(monthStart, "MMMM yyyy") : "Events"}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {view === "month" && (
                    <div className="flex items-center gap-1">
                      <Link href={query({ month: format(addMonths(monthStart, -1), "yyyy-MM") })} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50" aria-label="Previous month">
                        ←
                      </Link>
                      <Link href={query({ month: format(new Date(), "yyyy-MM") })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                        Today
                      </Link>
                      <Link href={query({ month: format(addMonths(monthStart, 1), "yyyy-MM") })} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50" aria-label="Next month">
                        →
                      </Link>
                    </div>
                  )}
                  <div className="flex overflow-hidden rounded-lg border border-slate-300 text-sm">
                    <Link href={query({ view: "month" })} className={view === "month" ? "bg-slate-900 px-3 py-1.5 text-white" : "px-3 py-1.5 text-slate-700 hover:bg-slate-50"}>
                      Month
                    </Link>
                    <Link href={query({ view: "list", month: undefined })} className={view === "list" ? "bg-slate-900 px-3 py-1.5 text-white" : "px-3 py-1.5 text-slate-700 hover:bg-slate-50"}>
                      List
                    </Link>
                  </div>
                  <TeamFilter teams={teams} current={teamId} />
                </div>
              }
            />
            <CardBody className="p-0">
              {view === "month" ? (
                <div className="overflow-x-auto">
                  <div className="grid min-w-[640px] grid-cols-7 border-t border-slate-100 text-sm">
                    {WEEKDAYS.map((d) => (
                      <div key={d} className="border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-xs font-semibold uppercase text-slate-500">
                        {d}
                      </div>
                    ))}
                    {days.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={`min-h-28 border-b border-r border-slate-100 p-1.5 ${isSameMonth(day, monthStart) ? "bg-white" : "bg-slate-50/60"}`}
                      >
                        <p
                          className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            isToday(day) ? "bg-brand-600 font-semibold text-white" : isSameMonth(day, monthStart) ? "text-slate-700" : "text-slate-400"
                          }`}
                        >
                          {format(day, "d")}
                        </p>
                        <ul className="space-y-1">
                          {eventsOn(day).map((e) => {
                            const long = differenceInCalendarDays(e.endsAt, e.startsAt) > LONG_EVENT_DAYS;
                            const allDay = differenceInCalendarDays(e.endsAt, e.startsAt) > 0;
                            const label = long ? `${e.title} ${isSameDay(e.startsAt, day) ? "starts" : "ends"}` : e.title;
                            return (
                              <li
                                key={e.id}
                                title={`${e.title} · ${e.team ? e.team.name : "Org-wide"} · ${format(e.startsAt, "d MMM HH:mm")}–${format(e.endsAt, "d MMM HH:mm")}${e.location ? ` · ${e.location}` : ""}`}
                                className={`truncate rounded px-1.5 py-0.5 text-xs ${CHIP_CLASSES[TYPE_COLORS[e.type] ?? "slate"]}`}
                              >
                                {!allDay && <span className="font-semibold">{format(e.startsAt, "HH:mm")} </span>}
                                {label}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : events.length === 0 ? (
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
                          <Badge color={TYPE_COLORS[e.type]}>{e.type.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {e.team ? e.team.name : "Org-wide"} · {format(e.startsAt, "EEE d MMM yyyy, HH:mm")}–{format(e.endsAt, "HH:mm")}
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
