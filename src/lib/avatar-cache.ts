import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import {
  adventurer,
  avataaars,
  bigEars,
  bottts,
  funEmoji,
  lorelei,
  micah,
  notionists,
  openPeeps,
  personas,
  pixelArt,
  shapes,
  thumbs,
} from "@dicebear/collection";

const memory = new Map<string, string>();

const STYLE_MAP = {
  notionists,
  lorelei,
  adventurer,
  avataaars,
  "open-peeps": openPeeps,
  micah,
  personas,
  "big-ears": bigEars,
  "fun-emoji": funEmoji,
  bottts,
  "pixel-art": pixelArt,
  thumbs,
  shapes,
} as const;

function parseAvatarUrl(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const style = parts[2];
    const seed = parsed.searchParams.get("seed") ?? "anon";
    const backgroundColor = parsed.searchParams.get("backgroundColor") ?? "94a3b8";
    const radius = Number(parsed.searchParams.get("radius") ?? "50");
    const size = Number(parsed.searchParams.get("size") ?? "64");
    return { style, seed, backgroundColor, radius, size };
  } catch {
    return null;
  }
}

function buildAvatarDataUrl(url: string) {
  const parsed = parseAvatarUrl(url);
  if (!parsed) return url;
  const collectionStyle = STYLE_MAP[parsed.style as keyof typeof STYLE_MAP];
  if (!collectionStyle) return url;
  return createAvatar(collectionStyle, {
    seed: parsed.seed,
    backgroundColor: [parsed.backgroundColor],
    radius: parsed.radius,
    size: parsed.size,
  }).toDataUri();
}

export function getCachedAvatar(url: string): string {
  const cached = memory.get(url);
  if (cached) return cached;
  const generated = buildAvatarDataUrl(url);
  memory.set(url, generated);
  return generated;
}

export function useCachedAvatar(url: string): string {
  return useMemo(() => getCachedAvatar(url), [url]);
}

export function preloadAvatars(urls: string[]) {
  for (const u of urls) getCachedAvatar(u);
}
