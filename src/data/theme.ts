import { useEffect, useSyncExternalStore } from "react";

export const BRAND_COLORS = [
  { id: "amber", hex: "#ebc020", label: "Amber" },
  { id: "violet", hex: "#7c3aed", label: "Violet" },
  { id: "lime", hex: "#a3e635", label: "Lime" },
  { id: "cyan", hex: "#06b6d4", label: "Cyan" },
  { id: "rose", hex: "#f43f5e", label: "Rose" },
  { id: "emerald", hex: "#10b981", label: "Emerald" },
  { id: "ink", hex: "#0f172a", label: "Ink" },
];

const STORAGE_KEY = "synqmap:brand-color";
const listeners = new Set<() => void>();
let cached: string | null = null;
let initialized = false;

function read(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
function ensure() {
  if (initialized) return;
  initialized = true;
  cached = read();
}
function emit() { listeners.forEach((l) => l()); }

export function applyBrandColor(hex: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", hex);
  root.style.setProperty(
    "--primary-soft",
    `color-mix(in oklab, ${hex} 18%, transparent)`,
  );
}

export function setBrandColor(hex: string) {
  cached = hex;
  initialized = true;
  try { localStorage.setItem(STORAGE_KEY, hex); } catch {}
  applyBrandColor(hex);
  emit();
}

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot(): string | null { ensure(); return cached; }
function getServerSnapshot(): string | null { return null; }

export function useBrandColor(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Mount once at app root to apply persisted brand color on load. */
export function BrandThemeApplier() {
  const color = useBrandColor();
  useEffect(() => {
    if (color) applyBrandColor(color);
  }, [color]);
  return null;
}
