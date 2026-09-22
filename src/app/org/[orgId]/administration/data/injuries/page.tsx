import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { addInjuryAction, updateInjuryAction } from "@/lib/actions/athlete-health";
import { canSeeMedical } from "@/lib/roles";
import { format } from "date-fns";

const STATUS_COLOR: Record<string, "red" | "amber" | "blue" | "green"> = {
  INJURED: "red",
  REHAB: "amber",
  RETURNED_TO_TRAIN: "blue",
  RETURNED_TO_PLAY: "green",
};
const STATUS_LABEL: Record<string, string> = {
  INJURED: "Injured",
  REHAB: "Rehab",
  RETURNED_TO_TRAIN: "Returned to train",
  RETURNED_TO_PLAY: "Returned to play",
};

export default async function InjuriesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const [injuries, athletes] = await Promise.all([
    db.injury.findMany({ where: { organizationId: orgId }, include: { athlete: true }, orderBy: { dateInjured: "desc" } }),
    db.membership.findMany({ where: { organizationId: orgId, role: "ATHLETE" }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  const canManage = canSeeMedical(membership.role);

  return (
    <div>
      <PageHeader
        title="Injury Process"
        subtitle="Player, date injured, report, treatment & healing, rehabilitation, return-to-train and return-to-play dates."
        action={
          <a href={`/api/export/${orgId}?type=injuries`} className="text-sm font-medium text-brand-600 hover:underline">
            Export CSV →
          </a>
        }
      />

      <div className="space-y-4">
        {injuries.length === 0 ? (
          <EmptyState title="No injuries logged" subtitle="Log a new injury using the form below." />
        ) : (
          injuries.map((i) => (
            <Card key={i.id}>
              <CardHeader
                title={i.athlete.name}
                subtitle={`Injured ${format(i.dateInjured, "d MMM yyyy")}`}
                action={<Badge color={STATUS_COLOR[i.status]}>{STATUS_LABEL[i.status]}</Badge>}
              />
              <CardBody>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Report: </span>
                  {i.report}
                </p>
                {canManage ? (
                  <form action={updateInjuryAction.bind(null, orgId, i.id)} className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                    <Field label="Treatment">
                      <Textarea name="treatment" rows={2} defaultValue={i.treatment ?? ""} />
                    </Field>
                    <Field label="Healing">
                      <Textarea name="healing" rows={2} defaultValue={i.healing ?? ""} />
                    </Field>
                    <Field label="Rehabilitation">
                      <Textarea name="rehabilitation" rows={2} defaultValue={i.rehabilitation ?? ""} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Return to train">
                        <Input type="date" name="returnToTrainDate" defaultValue={i.returnToTrainDate ? format(i.returnToTrainDate, "yyyy-MM-dd") : ""} />
                      </Field>
                      <Field label="Return to play">
                        <Input type="date" name="returnToPlayDate" defaultValue={i.returnToPlayDate ? format(i.returnToPlayDate, "yyyy-MM-dd") : ""} />
                      </Field>
                    </div>
                    <Field label="Status">
                      <Select name="status" defaultValue={i.status}>
                        {Object.entries(STATUS_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <div className="flex items-end">
                      <Button type="submit" size="sm" className="w-full">
                        Save update
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-500">
                    {i.treatment && <p>Treatment: {i.treatment}</p>}
                    {i.healing && <p>Healing: {i.healing}</p>}
                    {i.rehabilitation && <p>Rehabilitation: {i.rehabilitation}</p>}
                    {i.returnToTrainDate && <p>Return to train: {format(i.returnToTrainDate, "d MMM yyyy")}</p>}
                    {i.returnToPlayDate && <p>Return to play: {format(i.returnToPlayDate, "d MMM yyyy")}</p>}
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        )}

        {canManage && (
          <Card>
            <CardHeader title="Log a new injury" />
            <CardBody>
              <form action={addInjuryAction.bind(null, orgId)} className="grid gap-3 sm:grid-cols-2">
                <Field label="Player">
                  <Select name="athleteId" required>
                    {athletes.map((a) => (
                      <option key={a.userId} value={a.userId}>
                        {a.user.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date injured">
                  <Input type="date" name="dateInjured" required />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Report">
                    <Textarea name="report" rows={2} required placeholder="What happened, initial assessment" />
                  </Field>
                </div>
                <Field label="Status">
                  <Select name="status" defaultValue="INJURED">
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" className="w-full">
                    Log injury
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
