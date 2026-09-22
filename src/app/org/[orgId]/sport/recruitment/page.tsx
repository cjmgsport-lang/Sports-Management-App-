import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { addRecruitmentRecordAction, deleteRecruitmentRecordAction } from "@/lib/actions/recruitment";
import { canCoach } from "@/lib/roles";
import { format } from "date-fns";

export default async function RecruitmentPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { membership } = await requireOrgMembership(orgId);

  const [records, teams] = await Promise.all([
    db.recruitmentRecord.findMany({ where: { organizationId: orgId }, include: { team: true }, orderBy: { surname: "asc" } }),
    db.team.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
  ]);

  const canManage = canCoach(membership.role);

  return (
    <div>
      <PageHeader
        title="Recruitment & Retention"
        subtitle="Prospective and current athletes: name, DOB, start/end year, position, bursary/cost and dual-career status."
        action={
          <a href={`/api/export/${orgId}?type=recruitment`} className="text-sm font-medium text-brand-600 hover:underline">
            Export CSV →
          </a>
        }
      />

      <Card className="mb-6">
        <CardBody className="p-0">
          {records.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No records yet" subtitle="Add a recruit or current athlete using the form below." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Surname</th>
                    <th className="px-4 py-2">DOB</th>
                    <th className="px-4 py-2">Start</th>
                    <th className="px-4 py-2">End</th>
                    <th className="px-4 py-2">Position / Role</th>
                    <th className="px-4 py-2">Bursary / Cost</th>
                    <th className="px-4 py-2">Dual Career</th>
                    <th className="px-4 py-2">Team</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{r.name}</td>
                      <td className="px-4 py-2.5">{r.surname}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.dateOfBirth ? format(r.dateOfBirth, "d MMM yyyy") : "—"}</td>
                      <td className="px-4 py-2.5">{r.startYear ?? "—"}</td>
                      <td className="px-4 py-2.5">{r.endYear ?? "—"}</td>
                      <td className="px-4 py-2.5">{r.positionRole ?? "—"}</td>
                      <td className="px-4 py-2.5">{r.bursaryCost ?? "—"}</td>
                      <td className="px-4 py-2.5">{r.dualCareer ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.team?.name ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        {canManage && (
                          <form action={deleteRecruitmentRecordAction.bind(null, orgId, r.id)}>
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
        <Card>
          <CardHeader title="Add record" />
          <CardBody>
            <form action={addRecruitmentRecordAction.bind(null, orgId)} className="grid gap-3 sm:grid-cols-3">
              <Field label="Name">
                <Input name="name" required />
              </Field>
              <Field label="Surname">
                <Input name="surname" required />
              </Field>
              <Field label="Date of birth">
                <Input type="date" name="dateOfBirth" />
              </Field>
              <Field label="Start year">
                <Input type="number" name="startYear" placeholder="2026" />
              </Field>
              <Field label="End year">
                <Input type="number" name="endYear" placeholder="2029" />
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
              <Field label="Position / role">
                <Input name="positionRole" placeholder="e.g. Winger" />
              </Field>
              <Field label="Bursary / cost">
                <Input name="bursaryCost" placeholder="e.g. Full bursary, or R25,000/yr" />
              </Field>
              <Field label="Dual career">
                <Input name="dualCareer" placeholder="e.g. Studying BCom part-time" />
              </Field>
              <div className="sm:col-span-3">
                <Field label="Notes">
                  <Textarea name="notes" rows={2} />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" className="w-full">
                  Add record
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
