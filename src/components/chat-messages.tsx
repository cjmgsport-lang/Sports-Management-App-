"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
};

const POLL_INTERVAL_MS = 2500;

function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]) {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((m) => m.id));
  const merged = [...existing];
  for (const m of incoming) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      merged.push(m);
    }
  }
  merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return merged;
}

export function ChatMessages({
  channelId,
  initialMessages,
  currentUserId,
}: {
  channelId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCreatedAtRef = useRef<string | undefined>(initialMessages.at(-1)?.createdAt);

  // Server-rendered messages change when the page revalidates (e.g. right
  // after this viewer sends their own message via the form below) — merge
  // those in immediately rather than waiting for the next poll tick.
  useEffect(() => {
    setMessages((prev) => mergeMessages(prev, initialMessages));
  }, [initialMessages]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const url = new URL(`/api/chat/${channelId}/messages`, window.location.origin);
        if (lastCreatedAtRef.current) url.searchParams.set("after", lastCreatedAtRef.current);
        const res = await fetch(url.toString());
        if (!res.ok || cancelled) return;
        const data: { messages: ChatMessage[] } = await res.json();
        if (data.messages.length === 0 || cancelled) return;
        lastCreatedAtRef.current = data.messages.at(-1)!.createdAt;
        setMessages((prev) => mergeMessages(prev, data.messages));
      } catch {
        // Transient network hiccup — just try again next tick.
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [channelId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div ref={scrollRef} className="scrollbar-thin max-h-[50vh] flex-1 space-y-3 overflow-y-auto px-5 py-4">
      {messages.length === 0 && <p className="text-sm text-slate-400">No messages yet. Say hello!</p>}
      {messages.map((m) => (
        <div key={m.id}>
          <p className="text-sm">
            <span className="font-medium text-slate-800">
              {m.author.id === currentUserId ? "You" : m.author.name}
            </span>{" "}
            <span className="text-xs text-slate-400">{format(new Date(m.createdAt), "d MMM HH:mm")}</span>
          </p>
          <p className="text-sm text-slate-600">{m.body}</p>
        </div>
      ))}
    </div>
  );
}
