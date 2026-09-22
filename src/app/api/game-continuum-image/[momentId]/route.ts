import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { readUploadedFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ momentId: string }> }) {
  const { momentId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const moment = await db.gameContinuumMoment.findUnique({ where: { id: momentId }, include: { team: true } });
  if (!moment?.imagePath || !moment.imageMimeType) return NextResponse.json({ error: "No image set" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: moment.team.organizationId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const buffer = await readUploadedFile(moment.imagePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": moment.imageMimeType, "Cache-Control": "private, max-age=3600" },
  });
}
