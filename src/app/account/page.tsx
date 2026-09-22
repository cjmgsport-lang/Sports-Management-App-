import Link from "next/link";
import { requireUser } from "@/lib/current-user";
import { Button, Card, CardBody, CardHeader, Field, Input } from "@/components/ui";
import { changePasswordAction } from "@/lib/actions/auth";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const user = await requireUser();
  const { error, success } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Link href="/select-organization" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">My Account</h1>

      <Card className="mt-6">
        <CardHeader title={user.name} subtitle={user.email} />
        <CardBody>
          {success && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Password updated.</div>}
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <h2 className="mb-3 text-sm font-semibold text-slate-700">Change password</h2>
          <form action={changePasswordAction} className="space-y-3">
            <Field label="Current password">
              <Input type="password" name="currentPassword" required />
            </Field>
            <Field label="New password">
              <Input type="password" name="newPassword" required minLength={8} />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" name="confirmPassword" required minLength={8} />
            </Field>
            <Button type="submit" className="w-full">
              Update password
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
