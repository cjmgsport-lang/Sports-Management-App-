import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { addTrialistAction, createTrialEventAction, decideSelectionAction, scoreTrialCriteriaAction } from "@/lib/actions/trials";
import { TRIAL_CRITERIA, TRIAL_CRITERIA_SHORT_LABELS } from "@/lib/trial-criteria";
import { format } from "date-fns";

const STATUS_COLOR: Record<string, "slate" | "green" | "amber" | "red"> = {
  PENDING: "slate",
  SELECTED: "green",
  RESERVE: "amber",
  NOT_SELECTED: "red",
};

export default async function TrialsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const [teams, memberships, trialEvents] = await Promise.all([
    db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    db.membership.findMany({ where: { organizationId: orgId }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
    db.trialEvent.findMany({
      where: { organizationId: orgId },
      include: { team: true, selections: { include: { athlete: true } } },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Trials & Selection"
        subtitle="Run trials, score the nine selection domains and record decisions transparently."
        action={
          <a href={`/api/export/${orgId}?type=trials`} className="text-sm font-medium text-brand-600 hover:underline">
            Export CSV →
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {trialEvents.length === 0 ? (
            <EmptyState title="No trials yet" subtitle="Create a trial event to get started." />
          ) : (
            trialEvents.map((t) => (
              <Card key={t.id}>
                <CardHeader
                  title={t.name}
                  subtitle={`${format(t.date, "d MMM yyyy")}${t.venue ? ` · ${t.venue}` : ""}${t.team ? ` · ${t.team.name}` : ""}${t.ageGroup ? ` · ${t.ageGroup}` : ""}`}
                />
                <CardBody>
                  {t.selections.length === 0 ? (
                    <p className="mb-3 text-sm text-slate-400">No trialists added yet.</p>
                  ) : (
                    <div className="mb-3 space-y-3">
                      {t.selections.map((s) => (
                        <div key={s.id} className="rounded-lg border border-slate-100 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-slate-800">{s.athlete.name}</p>
                            <Badge color={STATUS_COLOR[s.status]}>{s.status.replace("_", " ")}</Badge>
                          </div>

                          <form action={decideSelectionAction.bind(null, orgId, s.id)} className="mt-2 flex items-center gap-2">
                            <Select name="status" defaultValue={s.status} className="w-32 text-xs">
                              <option value="PENDING">Pending</option>
                              <option value="SELECTED">Selected</option>
                              <option value="RESERVE">Reserve</option>
                              <option value="NOT_SELECTED">Not selected</option>
                            </Select>
                            <input name="notes" defaultValue={s.notes ?? ""} placeholder="Notes" className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                            <button type="submit" className="text-xs font-medium text-brand-600 hover:underline">
                              Save
                            </button>
                          </form>

                          <form
                            action={scoreTrialCriteriaAction.bind(null, orgId, s.id)}
                            className="mt-2 grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-2 sm:grid-cols-9"
                          >
                            {TRIAL_CRITERIA.map((c) => (
                              <label key={c} className="text-center">
                                <span className="block text-[10px] leading-tight text-slate-400">{TRIAL_CRITERIA_SHORT_LABELS[c]}</span>
                                <select
                                  name={c}
                                  defaultValue={s[c] ?? ""}
                                  className="mt-0.5 w-full rounded border border-slate-200 px-1 py-0.5 text-xs"
                                >
                                  <option value="">—</option>
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <option key={n} value={n}>
                                      {n}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ))}
                            <div className="col-span-3 sm:col-span-9">
                              <button type="submit" className="mt-1 text-xs font-medium text-brand-600 hover:underline">
                                Save scores
                              </button>
                            </div>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                  <form action={addTrialistAction.bind(null, orgId, t.id)} className="flex gap-2 border-t border-slate-100 pt-3">
                    <select name="athleteId" required className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                      {memberships.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm">
                      Add trialist
                    </Button>
                  </form>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="New trial event" />
          <CardBody>
            <form action={createTrialEventAction.bind(null, orgId)} className="space-y-3">
              <Field label="Name">
                <Input name="name" required placeholder="U16 Boys Hockey Trials" />
              </Field>
              <Field label="Date">
                <Input type="date" name="date" required />
              </Field>
              <Field label="Team (optional)">
                <Select name="teamId" defaultValue="">
                  <option value="">—</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age group">
                  <Input name="ageGroup" placeholder="U16" />
                </Field>
                <Field label="Venue">
                  <Input name="venue" placeholder="Main field" />
                </Field>
              </div>
              <Field label="Description">
                <Textarea name="description" rows={2} />
              </Field>
              <Button type="submit" className="w-full">
                Create trial event
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
