import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { upsertMemberProfileAction, upsertMedicalRecordAction, upsertTransportNeedAction, updateMembershipRoleAction } from "@/lib/actions/members";
import { canSeeMedical, isAdmin, ROLE_LABELS } from "@/lib/roles";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; userId: string }>;
}) {
  const { orgId, userId } = await params;
  const { membership: myMembership } = await requireOrgMembership(orgId);

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    include: {
      user: { include: { memberProfile: true, medicalRecord: true, transportNeed: true } },
    },
  });
  if (!membership) notFound();
  const { user } = membership;

  const showMedical = canSeeMedical(myMembership.role);

  return (
    <div>
      <PageHeader title={user.name} subtitle={user.email} />

      <div className="space-y-6">
        {isAdmin(myMembership.role) && (
          <Card>
            <CardHeader title="Organization role" />
            <CardBody>
              <form action={updateMembershipRoleAction.bind(null, orgId, userId)} className="flex items-end gap-3">
                <Select name="role" defaultValue={membership.role} className="w-56">
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm">
                  Update role
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Member information" subtitle="Contact details, address and emergency contact." />
          <CardBody>
            <form action={upsertMemberProfileAction.bind(null, orgId, userId)} className="grid gap-3 sm:grid-cols-2">
              <Field label="ID number">
                <Input name="idNumber" defaultValue={user.memberProfile?.idNumber ?? ""} />
              </Field>
              <Field label="School / Employer">
                <Input name="schoolOrEmployer" defaultValue={user.memberProfile?.schoolOrEmployer ?? ""} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <Input name="address" defaultValue={user.memberProfile?.address ?? ""} />
                </Field>
              </div>
              <Field label="Emergency contact name">
                <Input name="emergencyContactName" defaultValue={user.memberProfile?.emergencyContactName ?? ""} />
              </Field>
              <Field label="Emergency contact phone">
                <Input name="emergencyContactPhone" defaultValue={user.memberProfile?.emergencyContactPhone ?? ""} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <Textarea name="notes" rows={2} defaultValue={user.memberProfile?.notes ?? ""} />
                </Field>
              </div>
              <Button type="submit" className="sm:col-span-2">
                Save member information
              </Button>
            </form>
          </CardBody>
        </Card>

        {showMedical ? (
          <Card>
            <CardHeader title="Medical information" subtitle="Visible only to admins, coaches and medical staff." />
            <CardBody>
              <form action={upsertMedicalRecordAction.bind(null, orgId, userId)} className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Allergies">
                    <Textarea name="allergies" rows={2} defaultValue={user.medicalRecord?.allergies ?? ""} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Medical conditions">
                    <Textarea name="conditions" rows={2} defaultValue={user.medicalRecord?.conditions ?? ""} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Current medications">
                    <Textarea name="medications" rows={2} defaultValue={user.medicalRecord?.medications ?? ""} />
                  </Field>
                </div>
                <Field label="Medical aid name">
                  <Input name="medicalAidName" defaultValue={user.medicalRecord?.medicalAidName ?? ""} />
                </Field>
                <Field label="Medical aid number">
                  <Input name="medicalAidNumber" defaultValue={user.medicalRecord?.medicalAidNumber ?? ""} />
                </Field>
                <Field label="Doctor name">
                  <Input name="doctorName" defaultValue={user.medicalRecord?.doctorName ?? ""} />
                </Field>
                <Field label="Doctor phone">
                  <Input name="doctorPhone" defaultValue={user.medicalRecord?.doctorPhone ?? ""} />
                </Field>
                <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                  <input
                    type="checkbox"
                    name="consentGiven"
                    defaultChecked={user.medicalRecord?.consentGiven ?? false}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Consent given for medical treatment in emergencies
                </label>
                <Button type="submit" className="sm:col-span-2">
                  Save medical information
                </Button>
              </form>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <p className="text-sm text-slate-400">Medical information is restricted to admins, coaches and medical staff.</p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Transport needs" />
          <CardBody>
            <form action={upsertTransportNeedAction.bind(null, orgId, userId)} className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  name="needsTransport"
                  defaultChecked={user.transportNeed?.needsTransport ?? false}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Requires transport to/from training and matches
              </label>
              <Field label="Pickup address">
                <Input name="pickupAddress" defaultValue={user.transportNeed?.pickupAddress ?? ""} />
              </Field>
              <Field label="Drop-off address">
                <Input name="dropoffAddress" defaultValue={user.transportNeed?.dropoffAddress ?? ""} />
              </Field>
              <Field label="Contact phone">
                <Input name="contactPhone" defaultValue={user.transportNeed?.contactPhone ?? ""} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <Textarea name="notes" rows={2} defaultValue={user.transportNeed?.notes ?? ""} />
                </Field>
              </div>
              <Button type="submit" className="sm:col-span-2">
                Save transport needs
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
