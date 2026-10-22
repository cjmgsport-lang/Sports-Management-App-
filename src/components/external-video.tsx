import { toEmbedUrl } from "@/lib/external-links";

// A collapsed player for linked videos. Nothing loads until it's opened, so a
// long list of match videos stays fast.
export function ExternalVideo({ url, title }: { url: string; title: string }) {
  const embedUrl = toEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm font-medium text-brand-700 hover:underline">Watch</summary>
      <div className="mt-2 aspect-video w-full max-w-2xl overflow-hidden rounded-lg bg-slate-900">
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </details>
  );
}
