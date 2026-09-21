import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { Card, CardBody, LinkButton } from "@/components/ui";
import { ORG_TYPE_LABELS, ROLE_LABELS } from "@/lib/roles";

export default async function SelectOrganizationPage() {
  const user = await requireUser();

  if (user.memberships.length === 1) {
    redirect(`/org/${user.memberships[0].organizationId}/dashboard`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Choose an organization</h1>
      <p className="mt-1 text-sm text-slate-500">Select which workspace you'd like to open, {user.name}.</p>

      <div className="mt-6 space-y-3">
        {user.memberships.map((m) => (
          <Card key={m.id}>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{m.organization.name}</p>
                <p className="text-sm text-slate-500">
                  {ORG_TYPE_LABELS[m.organization.type]} · {ROLE_LABELS[m.role]}
                </p>
              </div>
              <LinkButton href={`/org/${m.organizationId}/dashboard`}>Open</LinkButton>
            </CardBody>
          </Card>
        ))}
      </div>

      {user.memberships.length === 0 && (
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-slate-500">You're not part of any organization yet.</p>
            <Link href="/signup" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
              Create one
            </Link>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
