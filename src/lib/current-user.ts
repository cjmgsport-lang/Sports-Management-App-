import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: { include: { organization: true } },
    },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Ensures the current user belongs to `organizationId` and returns their membership role. */
export async function requireOrgMembership(organizationId: string) {
  const user = await requireUser();
  const membership = user.memberships.find((m) => m.organizationId === organizationId);
  if (!membership) redirect("/select-organization");
  return { user, membership };
}
