import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_DIRECT_UPLOAD_BYTES } from "@/lib/storage";

// Issues short-lived tokens that let the browser upload large files straight
// to Blob storage, bypassing Vercel's 4.5 MB request-body limit on server
// actions. Tokens are only handed to members of the org, and only for paths
// inside that org's folder; the upload is recorded in the database afterwards
// by the normal server action (see resolveUploadedFile).
export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${orgId}/`)) throw new Error("Invalid upload path.");
        return { addRandomSuffix: true, maximumSizeInBytes: MAX_DIRECT_UPLOAD_BYTES };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 400 });
  }
}
