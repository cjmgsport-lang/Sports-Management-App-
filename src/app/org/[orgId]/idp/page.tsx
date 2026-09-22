import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Card, CardBody, CardHeader, EmptyState, Field, Button, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { createIdpAction } from "@/lib/actions/idp";
import { TRIAL_CRITERIA, TRIAL_CRITERIA_SHORT_LABELS } from "@/lib/trial-criteria";
import { format } from "date-fns";

export default async function IdpPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const [athletes, teams, plans] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: orgId, role: "ATHLETE" },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    db.individualDevelopmentPlan.findMany({
      where: { organizationId: orgId },
      include: { athlete: true, team: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Pull through each athlete's most recent trial-selection criteria scores
  // from Administration > Trials & Selection, for reference alongside the plan.
  const scoredTrials = await db.trialSelectionDocument.findMany({
    where: { trialEvent: { organizationId: orgId }, athleteId: { in: plans.map((p) => p.athleteId) } },
    include: { trialEvent: true },
    orderBy: { trialEvent: { date: "desc" } },
  });
  const latestScoresByAthlete = new Map<string, (typeof scoredTrials)[number]>();
  for (const s of scoredTrials) {
    if (!latestScoresByAthlete.has(s.athleteId)) latestScoresByAthlete.set(s.athleteId, s);
  }

  return (
    <div>
      <PageHeader title="Individual Development Plans" subtitle="Goals, strengths and action plans for every athlete." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {plans.length === 0 ? (
            <EmptyState title="No development plans yet" subtitle="Create the first IDP for an athlete." />
          ) : (
            plans.map((p) => (
              <Card key={p.id}>
                <CardHeader
                  title={p.athlete.name}
                  subtitle={`${p.team ? p.team.name + " · " : ""}${p.seasonName ?? ""} · by ${p.createdBy.name} on ${format(p.createdAt, "d MMM yyyy")}`}
                />
                <CardBody className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-slate-700">Goals: </span>
                    {p.goals}
                  </p>
                  {p.strengths && (
                    <p>
                      <span className="font-medium text-slate-700">Strengths: </span>
                      {p.strengths}
                    </p>
                  )}
                  {p.areasForImprovement && (
                    <p>
                      <span className="font-medium text-slate-700">Areas for improvement: </span>
                      {p.areasForImprovement}
                    </p>
                  )}
                  {p.actionPlan && (
                    <p>
                      <span className="font-medium text-slate-700">Action plan: </span>
                      {p.actionPlan}
                    </p>
                  )}
                  {p.reviewDate && <p className="text-xs text-slate-400">Next review: {format(p.reviewDate, "d MMM yyyy")}</p>}

                  {latestScoresByAthlete.has(p.athleteId) && (
                    <div className="border-t border-slate-100 pt-2">
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                        Selection criteria (from {latestScoresByAthlete.get(p.athleteId)!.trialEvent.name})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {TRIAL_CRITERIA.map((c) => {
                          const score = latestScoresByAthlete.get(p.athleteId)![c];
                          return score ? (
                            <Badge key={c} color="slate">
                              {TRIAL_CRITERIA_SHORT_LABELS[c]}: {score}/5
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="New development plan" />
          <CardBody>
            <form action={createIdpAction.bind(null, orgId)} className="space-y-3">
              <Field label="Athlete">
                <Select name="athleteId" required>
                  {athletes.map((a) => (
                    <option key={a.userId} value={a.userId}>
                      {a.user.name}
                    </option>
                  ))}
                </Select>
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
              <Field label="Season">
                <Input name="seasonName" placeholder="2026 Season" />
              </Field>
              <Field label="Goals">
                <Textarea name="goals" required rows={2} />
              </Field>
              <Field label="Strengths">
                <Textarea name="strengths" rows={2} />
              </Field>
              <Field label="Areas for improvement">
                <Textarea name="areasForImprovement" rows={2} />
              </Field>
              <Field label="Action plan">
                <Textarea name="actionPlan" rows={2} />
              </Field>
              <Field label="Next review date">
                <Input type="date" name="reviewDate" />
              </Field>
              <Button type="submit" className="w-full">
                Save plan
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
