import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { handleUpload, type HandleUploadBody, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_DIRECT_UPLOAD_BYTES } from "@/lib/storage";

// Issues short-lived tokens that let the browser upload large files straight
// to Blob storage, bypassing Vercel's 4.5 MB request-body limit on server
// actions. Tokens are only handed to members of the org, and only for paths
// inside that org's folder; the upload is recorded in the database afterwards
// by the normal server action (see resolveUploadedFile).
//
// Two flavours, matching FileInput's two attempts:
// - presigned URLs (blob.generate-presigned-url), which authenticate the same
//   way server-side put() does, so they work with stores connected through
//   the Vercel dashboard that only provide OIDC credentials;
// - classic client tokens (blob.generate-client-token), which need a static
//   BLOB_READ_WRITE_TOKEN.
export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as HandleUploadBody | HandleUploadPresignedBody;
  try {
    if (body.type === "blob.generate-presigned-url") {
      const { pathname } = body.payload;
      if (!pathname.startsWith(`${orgId}/`)) throw new Error("Invalid upload path.");
      const token = await issueSignedToken({ pathname, operations: ["put"], maximumSizeInBytes: MAX_DIRECT_UPLOAD_BYTES });
      const presignedUrlPayload = await presignUrl(token, {
        operation: "put",
        pathname,
        access: "private",
        addRandomSuffix: true,
        maximumSizeInBytes: MAX_DIRECT_UPLOAD_BYTES,
      });
      return NextResponse.json({ type: body.type, presignedUrlPayload });
    }

    const result = await handleUpload({
      request: req,
      body: body as HandleUploadBody,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${orgId}/`)) throw new Error("Invalid upload path.");
        return { addRandomSuffix: true, maximumSizeInBytes: MAX_DIRECT_UPLOAD_BYTES };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    // Shows up in the Vercel project's Logs tab, which is where a missing
    // Blob credential becomes visible.
    console.error("Blob upload token request failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 400 });
  }
}
