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

export type BrandFont = {
  id: string;
  label: string;
  stack: string;
  /** <link href> URL to inject for webfont loading. Optional for system stacks. */
  href?: string;
};

export const BRAND_FONTS: BrandFont[] = [
  {
    id: "general-sans",
    label: "General Sans",
    stack: "'General Sans', ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "inter",
    label: "Inter",
    stack: "'Inter', ui-sans-serif, system-ui, sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    stack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    stack: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap",
  },
  {
    id: "instrument-serif",
    label: "Instrument Serif",
    stack: "'Instrument Serif', ui-serif, Georgia, serif",
    href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
  },
  {
    id: "fraunces",
    label: "Fraunces",
    stack: "'Fraunces', ui-serif, Georgia, serif",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,800;1,400&display=swap",
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    stack: "'JetBrains Mono', ui-monospace, monospace",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
  },
];

const STORAGE_KEY = "synqmap:brand-color";
const FONT_STORAGE_KEY = "synqmap:brand-font";
const listeners = new Set<() => void>();
let cached: string | null = null;
let initialized = false;
const fontListeners = new Set<() => void>();
let cachedFont: string | null = null;
let fontInitialized = false;

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
  root.style.setProperty("--accent", hex);
  root.style.setProperty("--ring", hex);
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

function readFont(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(FONT_STORAGE_KEY); } catch { return null; }
}
function ensureFont() {
  if (fontInitialized) return;
  fontInitialized = true;
  cachedFont = readFont();
}
function emitFont() { fontListeners.forEach((l) => l()); }

function injectFontLink(font: BrandFont) {
  if (typeof document === "undefined" || !font.href) return;
  const id = `brand-font-${font.id}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = font.href;
  document.head.appendChild(link);
}

export function applyBrandFont(fontId: string) {
  if (typeof document === "undefined") return;
  const font = BRAND_FONTS.find((f) => f.id === fontId);
  if (!font) return;
  injectFontLink(font);
  const root = document.documentElement;
  root.style.setProperty("--font-sans", font.stack);
  root.style.setProperty("--font-display", font.stack);
}

export function setBrandFont(fontId: string) {
  cachedFont = fontId;
  fontInitialized = true;
  try { localStorage.setItem(FONT_STORAGE_KEY, fontId); } catch {}
  applyBrandFont(fontId);
  emitFont();
}

function subscribeFont(cb: () => void) { fontListeners.add(cb); return () => fontListeners.delete(cb); }
function getFontSnapshot(): string | null { ensureFont(); return cachedFont; }

export function useBrandFont(): string | null {
  return useSyncExternalStore(subscribeFont, getFontSnapshot, getServerSnapshot);
}

/** Mount once at app root to apply persisted brand color on load. */
export function BrandThemeApplier() {
  const color = useBrandColor();
  const font = useBrandFont();
  useEffect(() => {
    if (color) applyBrandColor(color);
  }, [color]);
  useEffect(() => {
    if (font) applyBrandFont(font);
  }, [font]);
  return null;
}
