import { useSyncExternalStore } from "react";
import type { Person } from "./event";

/**
 * Avatar system powered by DiceBear (https://www.dicebear.com).
 * - Every person gets a deterministic avatar derived from their id.
 * - The current user ("you") can override style / seed / background and the
 *   choice is persisted in localStorage so it sticks across reloads.
 */

export const AVATAR_STYLES = [
  { id: "notionists", label: "Notionists", vibe: "editorial, hand-drawn" },
  { id: "lorelei", label: "Lorelei", vibe: "clean line portraits" },
  { id: "adventurer", label: "Adventurer", vibe: "playful figurines" },
  { id: "avataaars", label: "Avataaars", vibe: "classic cartoon" },
  { id: "open-peeps", label: "Open Peeps", vibe: "sketchy & warm" },
  { id: "micah", label: "Micah", vibe: "soft minimal" },
  { id: "personas", label: "Personas", vibe: "bold blocks" },
  { id: "big-ears", label: "Big Ears", vibe: "weird & cute" },
  { id: "fun-emoji", label: "Fun Emoji", vibe: "emoji energy" },
  { id: "bottts", label: "Bottts", vibe: "lil robots" },
  { id: "pixel-art", label: "Pixel Art", vibe: "8-bit" },
  { id: "thumbs", label: "Thumbs", vibe: "thumbprint humans" },
  { id: "shapes", label: "Shapes", vibe: "pure geometry" },
] as const;

export type AvatarStyleId = (typeof AVATAR_STYLES)[number]["id"];

export type AvatarConfig = {
  style: AvatarStyleId;
  seed: string;
  bg: string; // hex without #
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DEFAULT_STYLES: AvatarStyleId[] = [
  "notionists", "lorelei", "adventurer", "open-peeps", "micah", "personas",
];

export function defaultAvatarFor(person: Pick<Person, "id" | "color">): AvatarConfig {
  const style = DEFAULT_STYLES[hash(person.id) % DEFAULT_STYLES.length];
  return {
    style,
    seed: person.id,
    bg: person.color.replace("#", ""),
  };
}

export function avatarUrl(cfg: AvatarConfig, size?: number) {
  const params = new URLSearchParams({
    seed: cfg.seed,
    backgroundColor: cfg.bg,
    radius: "50",
  });
  if (size) params.set("size", String(size));
  return `https://api.dicebear.com/9.x/${cfg.style}/svg?${params.toString()}`;
}

/* --- Persisted user avatar store (localStorage) --- */

const STORAGE_KEY = "synqmap:user-avatar";
const listeners = new Set<() => void>();

let cached: AvatarConfig | null = null;
let initialized = false;

function readStorage(): AvatarConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AvatarConfig;
  } catch {
    return null;
  }
}

function ensure() {
  if (initialized) return;
  initialized = true;
  cached = readStorage();
}

function emit() {
  listeners.forEach((l) => l());
}

export function setUserAvatar(next: AvatarConfig) {
  cached = next;
  initialized = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  emit();
}

export function clearUserAvatar() {
  cached = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): AvatarConfig | null {
  ensure();
  return cached;
}

function getServerSnapshot(): AvatarConfig | null {
  return null;
}

export function useUserAvatar(): AvatarConfig | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Returns the effective avatar for any person — overridden if it's "you". */
export function useAvatarFor(person: Pick<Person, "id" | "color">): AvatarConfig {
  const override = useUserAvatar();
  if (override && person.id === "you") return override;
  return defaultAvatarFor(person);
}

export function hasCustomizedAvatar(): boolean {
  ensure();
  return cached !== null;
}
