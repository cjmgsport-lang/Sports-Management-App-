import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { addSCEntryAction, deleteSCEntryAction } from "@/lib/actions/athlete-health";
import { canSeeMedical } from "@/lib/roles";
import { format } from "date-fns";

export default async function StrengthConditioningPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const [entries, athletes] = await Promise.all([
    db.strengthConditioningEntry.findMany({
      where: { organizationId: orgId },
      include: { athlete: true },
      orderBy: { date: "desc" },
    }),
    db.membership.findMany({ where: { organizationId: orgId, role: "ATHLETE" }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  const canManage = canSeeMedical(membership.role) || membership.role === "STRENGTH_CONDITIONING";

  return (
    <div>
      <PageHeader title="Strength & Conditioning" subtitle="Bench press, squat, sprint times and vertical jump, logged per athlete over time." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Entries" />
          <CardBody className="p-0">
            {entries.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No entries yet" subtitle="Log the first S&C test using the form." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
                      <th className="px-4 py-2">Athlete</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Bench (kg)</th>
                      <th className="px-4 py-2">Squat (kg)</th>
                      <th className="px-4 py-2">10m (s)</th>
                      <th className="px-4 py-2">40m (s)</th>
                      <th className="px-4 py-2">Vertical (cm)</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{e.athlete.name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{format(e.date, "d MMM yyyy")}</td>
                        <td className="px-4 py-2.5">{e.benchPressKg ?? "—"}</td>
                        <td className="px-4 py-2.5">{e.squatKg ?? "—"}</td>
                        <td className="px-4 py-2.5">{e.sprint10mSec ?? "—"}</td>
                        <td className="px-4 py-2.5">{e.sprint40mSec ?? "—"}</td>
                        <td className="px-4 py-2.5">{e.verticalJumpCm ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          {canManage && (
                            <form action={deleteSCEntryAction.bind(null, orgId, e.id)}>
                              <button className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {canManage && (
          <Card className="self-start">
            <CardHeader title="New entry" />
            <CardBody>
              <form action={addSCEntryAction.bind(null, orgId)} className="space-y-3">
                <Field label="Athlete">
                  <Select name="athleteId" required>
                    {athletes.map((a) => (
                      <option key={a.userId} value={a.userId}>
                        {a.user.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date">
                  <Input type="date" name="date" required />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bench (kg)">
                    <Input type="number" step="0.5" name="benchPressKg" />
                  </Field>
                  <Field label="Squat (kg)">
                    <Input type="number" step="0.5" name="squatKg" />
                  </Field>
                  <Field label="10m sprint (s)">
                    <Input type="number" step="0.01" name="sprint10mSec" />
                  </Field>
                  <Field label="40m sprint (s)">
                    <Input type="number" step="0.01" name="sprint40mSec" />
                  </Field>
                </div>
                <Field label="Vertical jump (cm)">
                  <Input type="number" step="0.5" name="verticalJumpCm" />
                </Field>
                <Field label="Notes">
                  <Textarea name="notes" rows={2} />
                </Field>
                <Button type="submit" className="w-full">
                  Save entry
                </Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
