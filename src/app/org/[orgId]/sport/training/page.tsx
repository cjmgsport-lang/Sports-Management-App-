import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { deleteTrainingResourceAction, uploadTrainingResourceAction } from "@/lib/actions/training-resources";
import { TRAINING_CATEGORIES, TRAINING_CATEGORY_LABELS, TRAINING_RESOURCE_KIND_LABELS, TRAINING_RESOURCE_KINDS } from "@/lib/training-categories";
import { canCoach } from "@/lib/roles";
import { format } from "date-fns";

export default async function TrainingFoldersPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const [resources, teams] = await Promise.all([
    db.trainingResource.findMany({
      where: { organizationId: orgId },
      include: { team: true, uploadedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
  ]);

  const canManage = canCoach(membership.role);
  const byCategory = new Map(TRAINING_CATEGORIES.map((c) => [c, resources.filter((r) => r.category === c)]));

  return (
    <div>
      <PageHeader title="Training" subtitle="Image, PDF, animation and video content, organized into the four training folders." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {TRAINING_CATEGORIES.map((category) => {
            const items = byCategory.get(category) ?? [];
            return (
              <Card key={category}>
                <CardHeader title={TRAINING_CATEGORY_LABELS[category]} subtitle={`${items.length} item${items.length === 1 ? "" : "s"}`} />
                <CardBody className="p-0">
                  {items.length === 0 ? (
                    <p className="p-5 text-sm text-slate-400">No content yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {items.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <a href={`/api/training-resource/${r.id}`} target="_blank" className="font-medium text-brand-700 hover:underline">
                                {r.title}
                              </a>
                              <Badge color="blue">{TRAINING_RESOURCE_KIND_LABELS[r.kind as keyof typeof TRAINING_RESOURCE_KIND_LABELS]}</Badge>
                              {r.team && <Badge color="slate">{r.team.name}</Badge>}
                            </div>
                            <p className="text-sm text-slate-500">
                              uploaded by {r.uploadedBy.name} on {format(r.createdAt, "d MMM yyyy")}
                            </p>
                            {r.description && <p className="mt-1 text-sm text-slate-400">{r.description}</p>}
                          </div>
                          {canManage && (
                            <form action={deleteTrainingResourceAction.bind(null, orgId, r.id)}>
                              <button className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>

        {canManage && (
          <Card className="self-start">
            <CardHeader title="Upload training content" />
            <CardBody>
              <form action={uploadTrainingResourceAction.bind(null, orgId)} className="space-y-3">
                <Field label="File">
                  <Input type="file" name="file" required />
                </Field>
                <Field label="Title">
                  <Input name="title" required placeholder="e.g. 4v4+2 rondo — press triggers" />
                </Field>
                <Field label="Folder">
                  <Select name="category" defaultValue="FOUNDATIONS">
                    {TRAINING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {TRAINING_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Type">
                  <Select name="kind" defaultValue="VIDEO">
                    {TRAINING_RESOURCE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {TRAINING_RESOURCE_KIND_LABELS[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Team (optional)">
                  <Select name="teamId" defaultValue="">
                    <option value="">All teams</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Description">
                  <Textarea name="description" rows={2} />
                </Field>
                <Button type="submit" className="w-full">
                  Upload
                </Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
