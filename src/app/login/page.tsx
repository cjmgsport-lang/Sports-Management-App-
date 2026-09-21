import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; org?: string }>;
}) {
  const { registered, org } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-lg font-bold text-brand-700">
            Freedom Sports Management
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your organization's workspace.</p>
        </div>

        <Card>
          <CardBody>
            {registered && (
              <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {org ? `"${org}" was created.` : "Account created."} Log in to continue.
              </div>
            )}
            <LoginForm />
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500">
          New to Freedom Sports Management?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:underline">
            Create an organization
          </Link>
        </p>
      </div>
    </main>
  );
}
