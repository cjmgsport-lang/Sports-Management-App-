"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";

const noticeSchema = z.object({
  teamId: z.string().optional(),
  title: z.string().min(2),
  body: z.string().min(2),
  audience: z.enum(["ALL", "COACHES", "PARENTS", "ATHLETES", "STAFF"]),
  pinned: z.coerce.boolean().optional(),
});

export async function createNoticeAction(orgId: string, formData: FormData) {
  const { user } = await requireOrgMembership(orgId);
  const parsed = noticeSchema.parse({
    teamId: formData.get("teamId") || undefined,
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    pinned: formData.get("pinned") === "on",
  });

  await db.notice.create({
    data: {
      organizationId: orgId,
      teamId: parsed.teamId || null,
      authorId: user.id,
      title: parsed.title,
      body: parsed.body,
      audience: parsed.audience,
      pinned: !!parsed.pinned,
    },
  });
  revalidatePath(`/org/${orgId}/noticeboard`);
}

export async function deleteNoticeAction(orgId: string, noticeId: string) {
  await requireOrgMembership(orgId);
  await db.notice.delete({ where: { id: noticeId } });
  revalidatePath(`/org/${orgId}/noticeboard`);
}
