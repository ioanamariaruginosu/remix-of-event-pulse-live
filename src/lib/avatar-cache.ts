import { useEffect, useState } from "react";

/**
 * Persistent avatar cache.
 *
 * First time we see a DiceBear URL we fetch it once, convert to a data URL
 * and stash it in localStorage. Every subsequent render (including next
 * page load) returns straight from memory — no network, no flicker, and
 * the avatars stay identical forever.
 */

const STORAGE_KEY = "synqmap:avatar-cache:v1";
const MAX_BYTES = 2_500_000; // ~2.5MB of base64 — plenty for landing-page set

const memory = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const subscribers = new Set<() => void>();
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(parsed)) memory.set(k, v);
  } catch {
    /* corrupt cache — ignore */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, string> = {};
    let bytes = 0;
    for (const [k, v] of memory) {
      bytes += k.length + v.length;
      if (bytes > MAX_BYTES) break;
      obj[k] = v;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* quota — ignore */
  }
}

function notify() {
  subscribers.forEach((cb) => cb());
}

async function loadOne(url: string): Promise<string> {
  const existing = inflight.get(url);
  if (existing) return existing;
  const p = (async () => {
    const res = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!res.ok) throw new Error(`avatar ${res.status}`);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    memory.set(url, dataUrl);
    persist();
    notify();
    return dataUrl;
  })();
  inflight.set(url, p);
  p.catch(() => {}).finally(() => inflight.delete(url));
  return p;
}

/** Returns a cached data URL if available, otherwise the original URL. */
export function getCachedAvatar(url: string): string {
  hydrate();
  return memory.get(url) ?? url;
}

/** Hook: returns data URL once cached, original URL meanwhile. */
export function useCachedAvatar(url: string): string {
  hydrate();
  const [value, setValue] = useState(() => memory.get(url) ?? url);
  useEffect(() => {
    const cached = memory.get(url);
    if (cached) {
      if (cached !== value) setValue(cached);
      return;
    }
    let cancelled = false;
    loadOne(url)
      .then((data) => {
        if (!cancelled) setValue(data);
      })
      .catch(() => {
        /* fall back to network URL already set */
      });
    const sub = () => {
      const c = memory.get(url);
      if (c && !cancelled) setValue(c);
    };
    subscribers.add(sub);
    return () => {
      cancelled = true;
      subscribers.delete(sub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return value;
}

/** Eagerly warm the cache for a list of URLs (fire and forget). */
export function preloadAvatars(urls: string[]) {
  hydrate();
  for (const u of urls) {
    if (!memory.has(u)) void loadOne(u).catch(() => {});
  }
}
