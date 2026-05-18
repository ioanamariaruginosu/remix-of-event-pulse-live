import { useSyncExternalStore } from "react";
import type { Person } from "./event";

export type ProfileGradient = {
  from: string; // hex with #
  via: string;
  to: string;
};

export type UserProfile = {
  name?: string;
  oneLiner?: string;
  intent?: string;
  tags?: string[];
  socials?: { linkedin?: string; x?: string; github?: string; email?: string };
  gradient?: ProfileGradient;
};

export const GRADIENT_PRESETS: { id: string; label: string; gradient: ProfileGradient }[] = [
  { id: "violet-dream", label: "Violet Dream", gradient: { from: "#7c3aed", via: "#a78bfa", to: "#22d3ee" } },
  { id: "sunset-blaze", label: "Sunset Blaze", gradient: { from: "#ff5e7e", via: "#f97316", to: "#facc15" } },
  { id: "mint-haze", label: "Mint Haze", gradient: { from: "#34d399", via: "#22d3ee", to: "#60a5fa" } },
  { id: "neon-pop", label: "Neon Pop", gradient: { from: "#bef264", via: "#22d3ee", to: "#a78bfa" } },
  { id: "rose-noir", label: "Rose Noir", gradient: { from: "#f472b6", via: "#7c3aed", to: "#0f172a" } },
  { id: "ember", label: "Ember", gradient: { from: "#fb7185", via: "#f97316", to: "#7c2d12" } },
  { id: "lagoon", label: "Lagoon", gradient: { from: "#0ea5e9", via: "#06b6d4", to: "#14b8a6" } },
  { id: "graphite", label: "Graphite", gradient: { from: "#111111", via: "#374151", to: "#9ca3af" } },
];

export const DEFAULT_GRADIENT: ProfileGradient = GRADIENT_PRESETS[0].gradient;

const STORAGE_KEY = "synqmap:user-profile";
const listeners = new Set<() => void>();
let cached: UserProfile | null = null;
let initialized = false;

function readStorage(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}
function ensure() {
  if (initialized) return;
  initialized = true;
  cached = readStorage();
}
function emit() { listeners.forEach((l) => l()); }

export function setUserProfile(next: UserProfile) {
  cached = next;
  initialized = true;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  emit();
}

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot(): UserProfile | null { ensure(); return cached; }
function getServerSnapshot(): UserProfile | null { return null; }

export function useUserProfile(): UserProfile | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Merge stored overrides onto the base "you" person. */
export function mergeYou(base: Person, profile: UserProfile | null): Person {
  if (!profile) return base;
  return {
    ...base,
    name: profile.name?.trim() || base.name,
    oneLiner: profile.oneLiner ?? base.oneLiner,
    intent: profile.intent ?? base.intent,
    tags: profile.tags && profile.tags.length ? profile.tags : base.tags,
    socials: { ...base.socials, ...(profile.socials ?? {}) },
  };
}

export function useYou(base: Person): Person {
  const p = useUserProfile();
  return mergeYou(base, p);
}

export function useYouGradient(): ProfileGradient {
  const p = useUserProfile();
  return p?.gradient ?? DEFAULT_GRADIENT;
}
