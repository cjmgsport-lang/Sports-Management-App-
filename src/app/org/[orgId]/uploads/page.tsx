import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { deleteUploadAction, uploadAssetAction } from "@/lib/actions/uploads";
import { format } from "date-fns";

const KIND_LABELS: Record<string, string> = {
  GPS: "GPS data",
  VIDEO: "Video",
  SESSION_ANIMATION: "Session animation",
  PDF: "PDF",
  IMAGE: "Image",
  OTHER: "Other",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function UploadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ kind?: string; fixtureId?: string; sessionId?: string }>;
}) {
  const { orgId } = await params;
  const { kind, fixtureId, sessionId } = await searchParams;
  await requireOrgMembership(orgId);

  const uploads = await db.uploadAsset.findMany({
    where: {
      organizationId: orgId,
      ...(kind ? { kind } : {}),
      ...(fixtureId ? { linkedFixtureId: fixtureId } : {}),
      ...(sessionId ? { linkedSessionId: sessionId } : {}),
    },
    include: { uploadedBy: true, fixture: { include: { team: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="GPS, Video & Files" subtitle="Upload GPS data, match/session video, session animations and PDFs." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <form className="mb-2 flex gap-2">
            <input type="hidden" name="fixtureId" value={fixtureId ?? ""} />
            <input type="hidden" name="sessionId" value={sessionId ?? ""} />
            <Select name="kind" defaultValue={kind ?? ""} className="w-56">
              <option value="">All file types</option>
              {Object.entries(KIND_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary" size="sm">
              Filter
            </Button>
          </form>

          {uploads.length === 0 ? (
            <EmptyState title="No files yet" subtitle="Upload GPS files, videos, session animations or PDFs using the form." />
          ) : (
            uploads.map((u) => (
              <Card key={u.id}>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <a href={`/api/files/${u.id}`} target="_blank" className="font-medium text-brand-700 hover:underline">
                        {u.filename}
                      </a>
                      <Badge color="blue">{KIND_LABELS[u.kind]}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatSize(u.sizeBytes)} · uploaded by {u.uploadedBy.name} on {format(u.createdAt, "d MMM yyyy")}
                      {u.fixture ? ` · ${u.fixture.team.name} vs ${u.fixture.opponent}` : ""}
                    </p>
                    {u.description && <p className="mt-1 text-sm text-slate-400">{u.description}</p>}
                  </div>
                  <form action={deleteUploadAction.bind(null, orgId, u.id)}>
                    <button className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                  </form>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="Upload file" />
          <CardBody>
            <form action={uploadAssetAction.bind(null, orgId)} className="space-y-3">
              <Field label="File">
                <Input type="file" name="file" required />
              </Field>
              <Field label="Type">
                <Select name="kind" defaultValue="VIDEO">
                  {Object.entries(KIND_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Description">
                <Textarea name="description" rows={2} placeholder="e.g. First half GPS export" />
              </Field>
              {fixtureId && <input type="hidden" name="linkedFixtureId" value={fixtureId} />}
              {sessionId && <input type="hidden" name="linkedSessionId" value={sessionId} />}
              <Button type="submit" className="w-full">
                Upload
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
