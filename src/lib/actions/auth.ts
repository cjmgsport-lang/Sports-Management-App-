"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

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

  const org = await db.organization.create({
    data: {
      name: orgName,
      type: orgType,
      city,
      subscription: {
        create: {
          plan: "STARTER",
          status: "TRIALING",
          seats: 25,
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
