"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { isAdmin, STAFF_DIRECTORY_ROLES, type MembershipRole } from "@/lib/roles";
import { seatLimitForPlan } from "@/lib/plan-limits";

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(STAFF_DIRECTORY_ROLES as [MembershipRole, ...MembershipRole[]]),
  phone: z.string().optional(),
  tempPassword: z.string().min(8).optional(),
});

/** Adds (or promotes an existing member to) a backroom staff role — Administration > People. Org-wide, not tied to a team roster. */
export async function addStaffMemberAction(orgId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can add staff.");

  const parsed = staffSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
    tempPassword: formData.get("tempPassword") || undefined,
  });
  const email = parsed.email.toLowerCase().trim();

  let user = await db.user.findUnique({ where: { email } });
  const isNewOrgMember =
    !user || !(await db.membership.findUnique({ where: { userId_organizationId: { userId: user.id, organizationId: orgId } } }));

  if (isNewOrgMember) {
    const subscription = await db.subscription.findUnique({ where: { organizationId: orgId } });
    const seatLimit = subscription ? subscription.seats : seatLimitForPlan("STARTER");
    const seatsUsed = await db.membership.count({ where: { organizationId: orgId } });
    if (seatsUsed >= seatLimit) {
      throw new Error(`This organization has reached its plan's seat limit (${seatLimit} members). Upgrade the plan in Settings to add more.`);
    }
  }

  if (!user) {
    if (!parsed.tempPassword) throw new Error("A temporary password is required for a brand-new staff member.");
    user = await db.user.create({
      data: { name: parsed.name, email, phone: parsed.phone, passwordHash: await bcrypt.hash(parsed.tempPassword, 10) },
    });
  } else if (parsed.phone) {
    await db.user.update({ where: { id: user.id }, data: { phone: parsed.phone } });
  }

  await db.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    update: { role: parsed.role },
    create: { userId: user.id, organizationId: orgId, role: parsed.role },
  });

  revalidatePath(`/org/${orgId}/administration/people`);
}
