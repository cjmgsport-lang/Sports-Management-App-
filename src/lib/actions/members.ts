"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { canSeeMedical, isAdmin, type MembershipRole } from "@/lib/roles";

const ALL_ROLES: MembershipRole[] = [
  "OWNER",
  "ADMIN",
  "HOD",
  "COACH",
  "ASSISTANT_COACH",
  "MEDICAL",
  "MANAGER",
  "ANALYST",
  "ADMIN_ASSISTANT",
  "LOGISTICS_MANAGER",
  "PERFORMANCE_PSYCH",
  "PHYSIO",
  "STRENGTH_CONDITIONING",
  "ATHLETE",
  "PARENT",
  "STAFF",
];

export async function upsertMemberProfileAction(orgId: string, userId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      idNumber: z.string().optional(),
      address: z.string().optional(),
      emergencyContactName: z.string().optional(),
      emergencyContactPhone: z.string().optional(),
      schoolOrEmployer: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse({
      idNumber: formData.get("idNumber") || undefined,
      address: formData.get("address") || undefined,
      emergencyContactName: formData.get("emergencyContactName") || undefined,
      emergencyContactPhone: formData.get("emergencyContactPhone") || undefined,
      schoolOrEmployer: formData.get("schoolOrEmployer") || undefined,
      notes: formData.get("notes") || undefined,
    });

  await db.memberProfile.upsert({
    where: { userId },
    update: parsed,
    create: { userId, organizationId: orgId, ...parsed },
  });
  revalidatePath(`/org/${orgId}/members/${userId}`);
}

export async function upsertMedicalRecordAction(orgId: string, userId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!canSeeMedical(membership.role)) throw new Error("You don't have permission to edit medical information.");

  const parsed = z
    .object({
      allergies: z.string().optional(),
      medicalAidName: z.string().optional(),
      medicalAidNumber: z.string().optional(),
      conditions: z.string().optional(),
      medications: z.string().optional(),
      doctorName: z.string().optional(),
      doctorPhone: z.string().optional(),
      consentGiven: z.coerce.boolean().optional(),
    })
    .parse({
      allergies: formData.get("allergies") || undefined,
      medicalAidName: formData.get("medicalAidName") || undefined,
      medicalAidNumber: formData.get("medicalAidNumber") || undefined,
      conditions: formData.get("conditions") || undefined,
      medications: formData.get("medications") || undefined,
      doctorName: formData.get("doctorName") || undefined,
      doctorPhone: formData.get("doctorPhone") || undefined,
      consentGiven: formData.get("consentGiven") === "on",
    });

  await db.medicalRecord.upsert({
    where: { userId },
    update: { ...parsed, consentGiven: !!parsed.consentGiven },
    create: { userId, organizationId: orgId, ...parsed, consentGiven: !!parsed.consentGiven },
  });
  revalidatePath(`/org/${orgId}/members/${userId}`);
}

export async function upsertTransportNeedAction(orgId: string, userId: string, formData: FormData) {
  await requireOrgMembership(orgId);
  const parsed = z
    .object({
      needsTransport: z.coerce.boolean().optional(),
      pickupAddress: z.string().optional(),
      dropoffAddress: z.string().optional(),
      contactPhone: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse({
      needsTransport: formData.get("needsTransport") === "on",
      pickupAddress: formData.get("pickupAddress") || undefined,
      dropoffAddress: formData.get("dropoffAddress") || undefined,
      contactPhone: formData.get("contactPhone") || undefined,
      notes: formData.get("notes") || undefined,
    });

  await db.transportNeed.upsert({
    where: { userId },
    update: { ...parsed, needsTransport: !!parsed.needsTransport },
    create: { userId, organizationId: orgId, ...parsed, needsTransport: !!parsed.needsTransport },
  });
  revalidatePath(`/org/${orgId}/members/${userId}`);
}

export async function updateMembershipRoleAction(orgId: string, userId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can change roles.");
  const role = z.enum(ALL_ROLES as [MembershipRole, ...MembershipRole[]]).parse(formData.get("role"));
  await db.membership.update({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    data: { role },
  });
  revalidatePath(`/org/${orgId}/members/${userId}`);
  revalidatePath(`/org/${orgId}/members`);
  revalidatePath(`/org/${orgId}/administration/people`);
}

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

/** Fixes a typo or updates contact details for someone already added — name, login email and phone. */
export async function updateMemberContactAction(orgId: string, userId: string, formData: FormData) {
  const { membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can edit member contact details.");

  const parsed = contactSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
  });
  const email = parsed.email.toLowerCase().trim();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    throw new Error("Another account already uses that email address.");
  }

  await db.user.update({ where: { id: userId }, data: { name: parsed.name, email, phone: parsed.phone } });
  revalidatePath(`/org/${orgId}/members/${userId}`);
  revalidatePath(`/org/${orgId}/members`);
  revalidatePath(`/org/${orgId}/administration/people`);
  revalidatePath(`/org/${orgId}/teams`);
}

/** Removes someone from this organization entirely — their org membership and every team roster spot in this org. The user account itself (and any other org they belong to) is untouched. */
export async function removeOrgMemberAction(orgId: string, userId: string) {
  const { user: actor, membership } = await requireOrgMembership(orgId);
  if (!isAdmin(membership.role)) throw new Error("Only admins can remove members.");
  if (userId === actor.id) throw new Error("You can't remove yourself from the organization.");

  await db.teamMembership.deleteMany({ where: { userId, team: { organizationId: orgId } } });
  await db.membership.delete({ where: { userId_organizationId: { userId, organizationId: orgId } } });

  revalidatePath(`/org/${orgId}/members`);
  revalidatePath(`/org/${orgId}/administration/people`);
  revalidatePath(`/org/${orgId}/teams`);
  redirect(`/org/${orgId}/members`);
}
