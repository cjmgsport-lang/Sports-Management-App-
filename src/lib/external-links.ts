// Links coaches paste in place of uploading a file — mostly full match video
// kept on YouTube or Google Drive, which is far too big (and too expensive)
// to store in Blob.

/** Returns the link if it's a valid http(s) URL, otherwise null. */
export function parseExternalUrl(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** A readable name for a link, used where an uploaded file would show its filename. */
export function describeExternalUrl(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host === "youtu.be" || host.endsWith("youtube.com")) return "YouTube video";
  if (host.endsWith("vimeo.com")) return "Vimeo video";
  if (host === "drive.google.com") return "Google Drive file";
  return host;
}

/**
 * The player URL for links that can be embedded in the app (YouTube, Vimeo,
 * Google Drive files), or null for anything else, which just opens in a new tab.
 */
export function toEmbedUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "vimeo.com") {
    const id = u.pathname.match(/^\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host === "player.vimeo.com") return url;
  if (host === "drive.google.com") {
    const id = u.pathname.match(/^\/file\/d\/([^/]+)/)?.[1] ?? u.searchParams.get("id");
    return id ? `https://drive.google.com/file/d/${id}/preview` : null;
  }
  return null;
}
