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
    // Private, not public: this app never hands a Blob URL to the client
    // directly anyway (everything's re-served through our own
    // access-controlled routes), and Vercel's current stores are
    // private-only. Reading it back requires the SDK's authenticated
    // get() rather than a plain fetch — see readUploadedFile below.
    const blob = await put(`${orgId}/${storedName}`, buffer, {
      access: "private",
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
 * check org membership themselves before calling this. A private Blob's URL
 * is never exposed to the client either way; the object requires
 * authentication to read regardless.
 */
export async function readUploadedFile(storedPath: string): Promise<Buffer> {
  if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
    // A private Blob store requires the SDK's own authenticated get() —
    // Vercel's OIDC-based auth for Blob isn't something a plain
    // unauthenticated fetch() of the URL can satisfy.
    const { get } = await import("@vercel/blob");
    const result = await get(storedPath, { access: "private" });
    if (!result) throw new Error(`Stored file not found: ${storedPath}`);
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  return readFile(path.join(process.cwd(), UPLOADS_DIR, storedPath));
}
