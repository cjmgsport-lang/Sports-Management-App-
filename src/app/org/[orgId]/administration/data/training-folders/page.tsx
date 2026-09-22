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

export default async function TrainingFoldersPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const uploads = await db.uploadAsset.findMany({
    where: { organizationId: orgId, folder: { not: null } },
    include: { uploadedBy: true },
    orderBy: [{ folder: "asc" }, { createdAt: "desc" }],
  });

  const existingFolders = Array.from(new Set(uploads.map((u) => u.folder!)));
  const byFolder = new Map<string, typeof uploads>();
  for (const u of uploads) {
    const list = byFolder.get(u.folder!) ?? [];
    list.push(u);
    byFolder.set(u.folder!, list);
  }

  return (
    <div>
      <PageHeader title="Training Folders & Uploads" subtitle="Session files, organized into your own folders." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {byFolder.size === 0 ? (
            <EmptyState title="No folders yet" subtitle="Upload a file with a folder name using the form to create your first one." />
          ) : (
            Array.from(byFolder.entries()).map(([folder, files]) => (
              <Card key={folder}>
                <CardHeader title={folder} subtitle={`${files.length} file${files.length === 1 ? "" : "s"}`} />
                <CardBody className="p-0">
                  <ul className="divide-y divide-slate-100">
                    {files.map((u) => (
                      <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <a href={`/api/files/${u.id}`} target="_blank" className="font-medium text-brand-700 hover:underline">
                              {u.filename}
                            </a>
                            <Badge color="blue">{KIND_LABELS[u.kind]}</Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            uploaded by {u.uploadedBy.name} on {format(u.createdAt, "d MMM yyyy")}
                          </p>
                          {u.description && <p className="mt-1 text-sm text-slate-400">{u.description}</p>}
                        </div>
                        <form action={deleteUploadAction.bind(null, orgId, u.id)}>
                          <button className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="Upload to a folder" />
          <CardBody>
            <form action={uploadAssetAction.bind(null, orgId)} className="space-y-3">
              <Field label="File">
                <Input type="file" name="file" required />
              </Field>
              <Field label="Folder">
                <Input name="folder" required list="existing-folders" placeholder="e.g. Pre-season 2026" />
                <datalist id="existing-folders">
                  {existingFolders.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </Field>
              <Field label="Type">
                <Select name="kind" defaultValue="PDF">
                  {Object.entries(KIND_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
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
      </div>
    </div>
  );
}
