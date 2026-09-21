import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./storage/uploads";

export async function saveUploadedFile(orgId: string, file: File) {
  const dir = path.join(process.cwd(), UPLOADS_DIR, orgId);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name);
  const storedName = `${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(dir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return {
    storedPath: path.join(orgId, storedName),
    sizeBytes: buffer.byteLength,
  };
}

export function resolveUploadPath(storedPath: string) {
  return path.join(process.cwd(), UPLOADS_DIR, storedPath);
}
