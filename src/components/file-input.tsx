"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui";

// Vercel rejects any request body over 4.5 MB before it reaches our server
// action, which surfaces as a bare "client-side exception" page. Leave
// headroom for the rest of the multipart form.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

type FileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapperClassName?: string;
  /**
   * When set, files too big to post through a server action are uploaded
   * straight from the browser to this org's Blob storage instead (see
   * /api/blob-upload). The form then submits `<name>BlobUrl` / `<name>BlobName`
   * in place of the file, which resolveUploadedFile in lib/storage picks up.
   */
  directUploadOrgId?: string;
};

type DirectUpload = { status: "uploading"; percent: number } | { status: "done"; url: string; filename: string };

export function FileInput({ onChange, wrapperClassName, directUploadOrgId, name, required, ...props }: FileInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [direct, setDirect] = useState<DirectUpload | null>(null);

  async function uploadDirect(input: HTMLInputElement, file: File, orgId: string) {
    // Blocks the form from submitting until the upload has finished.
    input.setCustomValidity("Please wait for the file to finish uploading.");
    setDirect({ status: "uploading", percent: 0 });
    try {
      const { upload, uploadPresigned } = await import("@vercel/blob/client");
      const options = {
        access: "private" as const,
        handleUploadUrl: `/api/blob-upload/${orgId}`,
        multipart: true,
        onUploadProgress: ({ percentage }: { percentage: number }) => setDirect({ status: "uploading", percent: Math.round(percentage) }),
      };
      const pathname = `${orgId}/${file.name}`;
      // Presigned uploads work with any connected Blob store; the classic
      // client-token flow needs BLOB_READ_WRITE_TOKEN. Try both.
      const blob = await uploadPresigned(pathname, file, options).catch((presignedErr) =>
        upload(pathname, file, options).catch(() => {
          throw presignedErr;
        })
      );
      // The file itself has already been stored; don't post it again.
      input.value = "";
      input.setCustomValidity("");
      setDirect({ status: "done", url: blob.url, filename: file.name });
    } catch (err) {
      const message = `Couldn't upload "${file.name}": ${err instanceof Error ? err.message : "unknown error"}`;
      input.setCustomValidity(message);
      setError(message);
      setDirect(null);
    }
  }

  return (
    <div className={wrapperClassName}>
      <Input
        type="file"
        name={name}
        required={required && direct?.status !== "done"}
        {...props}
        onChange={(e) => {
          const input = e.target;
          const file = input.files?.[0];
          setError(null);
          setDirect(null);
          input.setCustomValidity("");
          if (file && file.size > MAX_UPLOAD_BYTES) {
            if (directUploadOrgId) {
              void uploadDirect(input, file, directUploadOrgId);
            } else {
              const message = `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Files must be 4 MB or smaller.`;
              input.setCustomValidity(message);
              setError(message);
            }
          }
          onChange?.(e);
        }}
      />
      {direct?.status === "uploading" && <p className="mt-1 text-xs text-slate-500">Uploading… {direct.percent}%</p>}
      {direct?.status === "done" && (
        <>
          <input type="hidden" name={`${name}BlobUrl`} value={direct.url} />
          <input type="hidden" name={`${name}BlobName`} value={direct.filename} />
          <p className="mt-1 text-xs text-emerald-700">&quot;{direct.filename}&quot; uploaded. Finish the form to save it.</p>
        </>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
