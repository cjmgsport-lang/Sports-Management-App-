import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { addAthleteCommentAction, createFeedbackAction } from "@/lib/actions/feedback";
import { format } from "date-fns";

export default async function FeedbackPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { user } = await requireOrgMembership(orgId);

  const teamAthletes = await db.teamMembership.findMany({
    where: { role: "ATHLETE", team: { organizationId: orgId } },
    include: { team: true, user: true },
    orderBy: [{ team: { name: "asc" } }, { user: { name: "asc" } }],
  });

  const feedback = await db.weeklyFeedback.findMany({
    where: { team: { organizationId: orgId } },
    include: { athlete: true, coach: true, team: true },
    orderBy: { weekStarting: "desc" },
  });

  return (
    <div>
      <PageHeader title="Weekly Feedback" subtitle="Structured coach feedback and athlete reflection, every week." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {feedback.length === 0 ? (
            <EmptyState title="No feedback yet" subtitle="Give an athlete their first weekly feedback." />
          ) : (
            feedback.map((f) => (
              <Card key={f.id}>
                <CardHeader
                  title={`${f.athlete.name} — Week of ${format(f.weekStarting, "d MMM yyyy")}`}
                  subtitle={`${f.team.name} · Coach: ${f.coach.name}`}
                  action={<Badge color="blue">{f.performanceRating}/5</Badge>}
                />
                <CardBody className="space-y-2 text-sm">
                  {f.strengths && (
                    <p>
                      <span className="font-medium text-slate-700">Strengths: </span>
                      {f.strengths}
                    </p>
                  )}
                  {f.areasToImprove && (
                    <p>
                      <span className="font-medium text-slate-700">Areas to improve: </span>
                      {f.areasToImprove}
                    </p>
                  )}
                  {f.athleteComment ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-700">Athlete reflection: </span>
                      {f.athleteComment}
                    </p>
                  ) : (
                    f.athleteId === user.id && (
                      <form action={addAthleteCommentAction.bind(null, orgId, f.id)} className="flex gap-2">
                        <Textarea name="athleteComment" rows={1} placeholder="Add your reflection…" className="flex-1" />
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                      </form>
                    )
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="New feedback" />
          <CardBody>
            <form action={createFeedbackAction.bind(null, orgId)} className="space-y-3">
              <Field label="Athlete">
                <Select name="teamAthlete" required>
                  {teamAthletes.map((ta) => (
                    <option key={ta.id} value={`${ta.teamId}:${ta.userId}`}>
                      {ta.team.name} — {ta.user.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Week starting">
                <Input type="date" name="weekStarting" required />
              </Field>
              <Field label="Performance rating (1-5)">
                <Select name="performanceRating" defaultValue="3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Strengths">
                <Textarea name="strengths" rows={2} />
              </Field>
              <Field label="Areas to improve">
                <Textarea name="areasToImprove" rows={2} />
              </Field>
              <Button type="submit" className="w-full">
                Save feedback
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
