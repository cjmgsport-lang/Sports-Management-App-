import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./storage/uploads";

// On Vercel (and any other read-only/ephemeral-filesystem host) local disk
// writes don't persist across requests — worse, they throw outright, since
// the deployed function's filesystem isn't writable at all outside /tmp.
// So: any time we're actually running on Vercel, always use Blob storage
// instead of gating on BLOB_READ_WRITE_TOKEN specifically. Newer Blob
// stores connected via the Vercel dashboard authenticate automatically at
// runtime (OIDC-federated) rather than handing you a static token, so
// checking for that env var no longer reliably detects whether a store is
// attached — @vercel/blob's put() resolves the right auth path itself
// either way. Local disk remains the zero-config default for local dev,
// where process.env.VERCEL is never set.
function useBlobStorage() {
  return !!process.env.VERCEL;
}

export async function saveUploadedFile(orgId: string, file: File) {
  const ext = path.extname(file.name);
  const storedName = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (useBlobStorage()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${orgId}/${storedName}`, buffer, {
      access: "public",
      addRandomSuffix: false,
    });
    // storedPath is the blob's own URL — readUploadedFile below knows to
    // fetch it server-side rather than resolve it as a local path.
    return { storedPath: blob.url, sizeBytes: buffer.byteLength };
  }

  const dir = path.join(process.cwd(), UPLOADS_DIR, orgId);
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, storedName);
  await writeFile(fullPath, buffer);

  return {
    storedPath: path.join(orgId, storedName),
    sizeBytes: buffer.byteLength,
  };
}

/**
 * Reads back a file saved by saveUploadedFile. Used by the access-controlled
 * download routes (/api/files/[assetId], /api/org-logo/[orgId]) — callers
 * check org membership themselves before calling this, so a blob's URL is
 * never exposed directly to the client even though Vercel Blob serves
 * "public" objects at an unguessable-but-technically-public URL.
 */
export async function readUploadedFile(storedPath: string): Promise<Buffer> {
  if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
    const res = await fetch(storedPath);
    if (!res.ok) throw new Error(`Failed to fetch stored file: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(path.join(process.cwd(), UPLOADS_DIR, storedPath));
}
