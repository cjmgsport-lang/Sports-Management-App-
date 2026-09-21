import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveUploadPath } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org?.logoPath || !org.logoMimeType) {
    return NextResponse.json({ error: "No logo set" }, { status: 404 });
  }

  const buffer = await readFile(resolveUploadPath(org.logoPath));
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": org.logoMimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
