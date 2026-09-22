"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";
import { PLAN_SEAT_LIMITS } from "@/lib/plan-limits";
import { requireUser } from "@/lib/current-user";

const signupSchema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  orgType: z.enum(["SCHOOL", "CLUB", "UNIVERSITY", "FRANCHISE", "PROFESSIONAL", "FEDERATION"]),
  city: z.string().optional(),
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signupAction(formData: FormData): Promise<void> {
  const parsed = signupSchema.safeParse({
    orgName: formData.get("orgName"),
    orgType: formData.get("orgType"),
    city: formData.get("city") || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`);
  }

  const { orgName, orgType, city, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    redirect(`/signup?error=${encodeURIComponent("An account with that email already exists. Please log in instead.")}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const baseSlug = slugify(orgName);
  let slug = baseSlug;
  let suffix = 1;
  while (await db.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const org = await db.organization.create({
    data: {
      name: orgName,
      type: orgType,
      city,
      slug,
      subscription: {
        create: {
          plan: "STARTER",
          status: "TRIALING",
          seats: PLAN_SEAT_LIMITS.STARTER,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      memberships: {
        create: {
          role: "OWNER",
          user: {
            create: {
              name,
              email: normalizedEmail,
              passwordHash,
            },
          },
        },
      },
    },
  });

  redirect(`/login?registered=1&org=${encodeURIComponent(org.name)}`);
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation don't match",
    path: ["confirmPassword"],
  });

/** Lets the signed-in user set their own password — how someone given a temporary password by an admin takes ownership of their account. */
export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    redirect(`/account?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`);
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    redirect(`/account?error=${encodeURIComponent("Current password is incorrect.")}`);
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });

  revalidatePath("/account");
  redirect("/account?success=1");
}
