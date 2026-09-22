import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { createBookingAction, createResourceAction, updateBookingStatusAction } from "@/lib/actions/resources";
import { format } from "date-fns";

const CATEGORY_LABELS: Record<string, string> = {
  FIELD: "Field",
  BALLS: "Balls",
  BIBS: "Bibs",
  CONES: "Cones",
  FLAT_MARKERS: "Flat Markers",
  POLES: "Poles",
  MANNEQUINS: "Mannequins",
  MINI_GOALS: "Mini-Goals",
  GPS_UNIT: "GPS Units",
  VIDEO_EQUIPMENT: "Video Equipment",
  VIDEO_ANALYSIS: "Video Analysis",
  OTHER: "Other",
};

const STATUS_COLOR: Record<string, "slate" | "green" | "amber" | "red"> = {
  REQUESTED: "amber",
  APPROVED: "green",
  REJECTED: "red",
  CANCELED: "slate",
};

export default async function ResourcesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const [teams, resources] = await Promise.all([
    db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    db.resource.findMany({
      where: { organizationId: orgId },
      include: { bookings: { include: { team: true, requestedBy: true }, orderBy: { startsAt: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Resources & Booking"
        subtitle="Share fields, balls, bibs, cones, flat markers, poles, mannequins, mini-goals, GPS units, video equipment and video analysis without double-booking."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {resources.length === 0 ? (
            <EmptyState title="No resources yet" subtitle="Add equipment and facilities to share across teams." />
          ) : (
            resources.map((r) => (
              <Card key={r.id}>
                <CardHeader title={r.name} subtitle={`${CATEGORY_LABELS[r.category]} · Qty: ${r.quantityTotal}${r.notes ? ` · ${r.notes}` : ""}`} />
                <CardBody>
                  {r.bookings.length === 0 ? (
                    <p className="mb-3 text-sm text-slate-400">No bookings yet.</p>
                  ) : (
                    <ul className="mb-3 divide-y divide-slate-100">
                      {r.bookings.map((b) => (
                        <li key={b.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <div>
                            <p className="font-medium text-slate-800">
                              {format(b.startsAt, "d MMM HH:mm")} – {format(b.endsAt, "HH:mm")} · Qty {b.quantity}
                            </p>
                            <p className="text-xs text-slate-400">
                              {b.team?.name ?? "Org-wide"} · requested by {b.requestedBy.name} {b.purpose ? `· ${b.purpose}` : ""}
                            </p>
                          </div>
                          <form action={updateBookingStatusAction.bind(null, orgId, b.id)} className="flex items-center gap-1.5">
                            <select name="status" defaultValue={b.status} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
                              <option value="REQUESTED">Requested</option>
                              <option value="APPROVED">Approved</option>
                              <option value="REJECTED">Rejected</option>
                              <option value="CANCELED">Canceled</option>
                            </select>
                            <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
                            <button type="submit" className="text-xs font-medium text-brand-600 hover:underline">
                              Save
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form action={createBookingAction.bind(null, orgId, r.id)} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                    <Select name="teamId" defaultValue="" className="w-40">
                      <option value="">Org-wide</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                    <Input type="datetime-local" name="startsAt" required className="w-48" />
                    <Input type="datetime-local" name="endsAt" required className="w-48" />
                    <Input type="number" name="quantity" min={1} defaultValue={1} className="w-20" />
                    <Input name="purpose" placeholder="Purpose" className="w-40" />
                    <Button type="submit" size="sm">
                      Book
                    </Button>
                  </form>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="New resource" />
          <CardBody>
            <form action={createResourceAction.bind(null, orgId)} className="space-y-3">
              <Field label="Name">
                <Input name="name" required placeholder="Field 2, GPS Unit #3, etc." />
              </Field>
              <Field label="Category">
                <Select name="category" defaultValue="FIELD">
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantity available">
                <Input type="number" name="quantityTotal" min={1} defaultValue={1} required />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" rows={2} />
              </Field>
              <Button type="submit" className="w-full">
                Add resource
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
