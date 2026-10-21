"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui";

// Vercel rejects any request body over 4.5 MB before it reaches our server
// action, which surfaces as a bare "client-side exception" page. Catch it in
// the browser instead (leaving headroom for the rest of the multipart form).
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function FileInput({
  onChange,
  wrapperClassName,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { wrapperClassName?: string }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={wrapperClassName}>
      <Input
        type="file"
        {...props}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const message =
            file && file.size > MAX_UPLOAD_BYTES
              ? `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Files must be 4 MB or smaller.`
              : "";
          e.target.setCustomValidity(message);
          setError(message || null);
          onChange?.(e);
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
