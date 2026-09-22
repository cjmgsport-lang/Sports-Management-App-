import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { addStaffMemberAction } from "@/lib/actions/staff";
import { isAdmin, ROLE_LABELS, STAFF_DIRECTORY_ROLES } from "@/lib/roles";

export default async function AdministrationPeoplePage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const staff = await db.membership.findMany({
    where: { organizationId: orgId, role: { in: STAFF_DIRECTORY_ROLES } },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const canManage = isAdmin(membership.role);

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="Manager, administrative assistant, coaching and support staff — the backroom team."
        action={
          <a href={`/api/export/${orgId}?type=staff`} className="text-sm font-medium text-brand-600 hover:underline">
            Export CSV →
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Staff directory" />
          <CardBody className="p-0">
            {staff.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No staff yet" subtitle="Add your first staff member using the form." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staff.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{m.user.name}</td>
                        <td className="px-4 py-2.5">
                          <Badge color="blue">{ROLE_LABELS[m.role]}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{m.user.email}</td>
                        <td className="px-4 py-2.5 text-slate-500">{m.user.phone ?? "—"}</td>
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
            <CardHeader title="Add staff member" />
            <CardBody>
              <form action={addStaffMemberAction.bind(null, orgId)} className="space-y-3">
                <Field label="Name">
                  <Input name="name" required placeholder="Full name" />
                </Field>
                <Field label="Email">
                  <Input type="email" name="email" required placeholder="name@club.co.za" />
                </Field>
                <Field label="Role">
                  <Select name="role" defaultValue="MANAGER">
                    {STAFF_DIRECTORY_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Phone (optional)">
                  <Input name="phone" placeholder="+27 82 000 0000" />
                </Field>
                <Button type="submit" className="w-full">
                  Add to directory
                </Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
