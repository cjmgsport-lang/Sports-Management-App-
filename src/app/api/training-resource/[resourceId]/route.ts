import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { readUploadedFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resource = await db.trainingResource.findUnique({ where: { id: resourceId } });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: resource.organizationId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const buffer = await readUploadedFile(resource.storedPath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": resource.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(resource.title)}"`,
    },
  });
}
