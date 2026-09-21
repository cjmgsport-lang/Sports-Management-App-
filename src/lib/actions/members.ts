"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { canSeeMedical, isAdmin } from "@/lib/roles";

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
  const role = z
    .enum(["OWNER", "ADMIN", "HOD", "COACH", "ASSISTANT_COACH", "MEDICAL", "MANAGER", "ANALYST", "ATHLETE", "PARENT", "STAFF"])
    .parse(formData.get("role"));
  await db.membership.update({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    data: { role },
  });
  revalidatePath(`/org/${orgId}/members/${userId}`);
  revalidatePath(`/org/${orgId}/members`);
}
