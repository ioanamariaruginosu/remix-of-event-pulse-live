import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Maximize2,
  X,
  RotateCw,
  Upload,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";

export type EventMapRole = "organizer" | "attendee";

type MapItem = {
  id: string;
  kind: "default" | "image";
  label: string;
  src?: string;
  rotation: number;
};

function defaultMaps(): MapItem[] {
  return [{ id: "default", kind: "default", label: "Floor 1", rotation: 0 }];
}

function loadMaps(eventId: string): MapItem[] {
  try {
    const raw = localStorage.getItem(`event-maps:${eventId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as MapItem[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return defaultMaps();
}

function saveMaps(eventId: string, maps: MapItem[]) {
  try {
    localStorage.setItem(`event-maps:${eventId}`, JSON.stringify(maps));
  } catch {}
}

export function EventMap({
  eventId,
  role,
  title = "You are here",
  defaultContent,
}: {
  eventId: string;
  role: EventMapRole;
  title?: string;
  defaultContent?: ReactNode;
}) {
  const [maps, setMaps] = useState<MapItem[]>(() => loadMaps(eventId));
  const [activeIdx, setActiveIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveMaps(eventId, maps), [eventId, maps]);
  useEffect(() => {
    if (activeIdx >= maps.length) setActiveIdx(Math.max(0, maps.length - 1));
  }, [maps.length, activeIdx]);

  // Cross-tab sync: when organizer updates, attendees pick it up.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === `event-maps:${eventId}` && e.newValue) {
        try {
          const next = JSON.parse(e.newValue) as MapItem[];
          if (Array.isArray(next) && next.length) setMaps(next);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [eventId]);

  const active = maps[activeIdx];
  const isOrganizer = role === "organizer";
  const isImage = active?.kind === "image";

  const update = (patch: Partial<MapItem>) =>
    setMaps((m) => m.map((x, i) => (i === activeIdx ? { ...x, ...patch } : x)));

  const rotate = () => update({ rotation: ((active?.rotation ?? 0) + 90) % 360 });

  const move = (dir: -1 | 1) => {
    setMaps((m) => {
      const j = activeIdx + dir;
      if (j < 0 || j >= m.length) return m;
      const next = m.slice();
      [next[activeIdx], next[j]] = [next[j], next[activeIdx]];
      return next;
    });
    setActiveIdx((i) => Math.min(Math.max(i + dir, 0), maps.length - 1));
  };

  const onUpload = (replace: boolean) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      if (replace) {
        update({ kind: "image", src, rotation: 0 });
      } else {
        const next: MapItem = {
          id: crypto.randomUUID(),
          kind: "image",
          src,
          rotation: 0,
          label: `Floor ${maps.length + 1}`,
        };
        setMaps((m) => [...m, next]);
        setActiveIdx(maps.length);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeActive = () => {
    if (maps.length <= 1) return;
    setMaps((m) => m.filter((_, i) => i !== activeIdx));
  };

  const resetToDefault = () =>
    update({ kind: "default", src: undefined, rotation: 0, label: active?.label ?? "Floor 1" });

  const MapBody = useMemo(
    () =>
      function MapBody({ inFullscreen = false }: { inFullscreen?: boolean }) {
        if (!active) return null;
        if (active.kind === "default") {
          return (
            <div
              className="w-full h-full"
              style={{ transform: `rotate(${active.rotation}deg)`, transition: "transform 300ms" }}
            >
              {defaultContent ?? (
                <div className="w-full h-full grid place-items-center text-xs text-foreground/40">
                  No map configured
                </div>
              )}
            </div>
          );
        }
        return (
          <img
            src={active.src}
            alt={active.label}
            draggable={false}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
              inFullscreen ? "" : ""
            }`}
            style={{ transform: `rotate(${active.rotation}deg)` }}
          />
        );
      },
    [active, defaultContent]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] font-display italic text-foreground/40 uppercase tracking-widest">
          {title}
        </div>
        <div className="flex items-center gap-1">
          {isOrganizer && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                aria-label={isImage ? "Replace map image" : "Upload custom map image"}
                title={isImage ? "Replace map image" : "Upload custom map image"}
              >
                <Upload className="size-3" />
              </button>
              <button
                onClick={rotate}
                className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                aria-label="Rotate map 90 degrees"
                title="Rotate 90°"
              >
                <RotateCw className="size-3" />
              </button>
              {isImage && defaultContent && (
                <button
                  onClick={resetToDefault}
                  className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                  aria-label="Restore default map"
                  title="Restore default"
                >
                  <RotateCcw className="size-3" />
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setFullscreen(true)}
            className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
            aria-label="Open map fullscreen"
            title="Fullscreen"
          >
            <Maximize2 className="size-3" />
          </button>
        </div>
      </div>

      <div
        className="relative w-full rounded-2xl bg-foreground/[0.04] ring-1 ring-border overflow-hidden grid place-items-center"
        style={{ aspectRatio: "16 / 11" }}
      >
        <div className="w-full h-full p-3">
          <MapBody />
        </div>
      </div>

      {maps.length > 1 || isOrganizer ? (
        <div className="mt-2 flex items-center gap-1 overflow-x-auto">
          {maps.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveIdx(i)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
                i === activeIdx ? "bg-foreground text-white" : "bg-foreground/5 text-foreground/60"
              }`}
            >
              {m.label}
            </button>
          ))}
          {isOrganizer && (
            <>
              <div className="mx-1 h-4 w-px bg-border" />
              <button
                onClick={() => move(-1)}
                disabled={activeIdx === 0}
                className="p-1 rounded-md ring-1 ring-border disabled:opacity-30 hover:bg-foreground/5"
                aria-label="Move map left"
                title="Reorder ←"
              >
                <ArrowLeft className="size-3" />
              </button>
              <button
                onClick={() => move(1)}
                disabled={activeIdx >= maps.length - 1}
                className="p-1 rounded-md ring-1 ring-border disabled:opacity-30 hover:bg-foreground/5"
                aria-label="Move map right"
                title="Reorder →"
              >
                <ArrowRight className="size-3" />
              </button>
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (ev) =>
                    onUpload(false)(ev as unknown as React.ChangeEvent<HTMLInputElement>);
                  input.click();
                }}
                className="p-1 rounded-md ring-1 ring-border hover:bg-foreground/5"
                aria-label="Add new map"
                title="Add map"
              >
                <Plus className="size-3" />
              </button>
              {maps.length > 1 && (
                <button
                  onClick={removeActive}
                  className="p-1 rounded-md ring-1 ring-border hover:bg-foreground/5 text-destructive"
                  aria-label="Remove current map"
                  title="Remove"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </>
          )}
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUpload(true)}
      />

      {fullscreen && (
        <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/60">
              {title} · {active?.label}
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="size-9 grid place-items-center rounded-full ring-1 ring-border hover:bg-foreground/5"
              aria-label="Close fullscreen"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 grid place-items-center p-6 overflow-auto">
            <div className="w-full max-w-3xl aspect-[16/11]">
              <MapBody inFullscreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
