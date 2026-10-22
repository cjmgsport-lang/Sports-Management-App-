"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { FileInput } from "@/components/file-input";

// A file picker with an alternative link box (YouTube, Google Drive…). One of
// the two is required; the server action prefers the file when both are given.
export function FileOrLinkInput({
  name,
  directUploadOrgId,
  accept,
  className,
  wrapperClassName,
}: {
  name: string;
  directUploadOrgId?: string;
  accept?: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const [link, setLink] = useState("");

  return (
    <div className={`space-y-2 ${wrapperClassName ?? ""}`}>
      <FileInput name={name} required={!link.trim()} directUploadOrgId={directUploadOrgId} accept={accept} className={className} />
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-slate-500">or link</span>
        <Input
          type="url"
          name="externalUrl"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste a YouTube or Google Drive link"
          className={className}
        />
      </div>
    </div>
  );
}
