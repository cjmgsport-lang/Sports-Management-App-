import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readUploadedFile } from "@/lib/storage";

// Intentionally unauthenticated — serves the logo shown on the org's public
// page (/o/[slug]), which anonymous visitors need to be able to see.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org?.logoPath || !org.logoMimeType) {
    return NextResponse.json({ error: "No logo set" }, { status: 404 });
  }

  const buffer = await readUploadedFile(org.logoPath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": org.logoMimeType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
