import Link from "next/link";
import { signupAction } from "@/lib/actions/auth";
import { Button, Card, CardBody, Field, Input, Select } from "@/components/ui";
import { ORG_TYPE_LABELS } from "@/lib/roles";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <Link href="/" className="text-lg font-bold text-brand-700">
            Freedom Sports Management
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create your organization</h1>
          <p className="mt-1 text-sm text-slate-500">
            Set up your school, club, university, franchise, professional team or federation in a minute.
          </p>
        </div>

        <Card>
          <CardBody>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <form action={signupAction} className="space-y-4">
              <Field label="Organization name">
                <Input name="orgName" required placeholder="e.g. Pretoria Boys High School" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Organization type">
                  <Select name="orgType" defaultValue="CLUB" required>
                    {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="City / Town">
                  <Input name="city" placeholder="e.g. Cape Town" />
                </Field>
              </div>
              <hr className="border-slate-100" />
              <Field label="Your full name">
                <Input name="name" required placeholder="Jane Smith" />
              </Field>
              <Field label="Your email">
                <Input type="email" name="email" required placeholder="jane@club.co.za" />
              </Field>
              <Field label="Password">
                <Input type="password" name="password" required minLength={8} placeholder="At least 8 characters" />
              </Field>
              <Button type="submit" className="w-full">
                Create organization
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
