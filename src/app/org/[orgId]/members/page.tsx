import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Badge, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/roles";

export default async function MembersPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const memberships = await db.membership.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        include: { memberProfile: true, medicalRecord: true, transportNeed: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Member Forms" subtitle="Member information, medical details and transport needs for every person in your organization." />

      {memberships.length === 0 ? (
        <EmptyState title="No members yet" subtitle="Add members from the Teams page." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => (
            <Link key={m.id} href={`/org/${orgId}/members/${m.userId}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardBody>
                  <p className="font-semibold text-slate-900">{m.user.name}</p>
                  <p className="text-sm text-slate-500">{m.user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge color="blue">{ROLE_LABELS[m.role]}</Badge>
                    {m.user.memberProfile && <Badge color="green">Profile ✓</Badge>}
                    {m.user.medicalRecord && <Badge color="amber">Medical ✓</Badge>}
                    {m.user.transportNeed && <Badge color="purple">Transport ✓</Badge>}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
