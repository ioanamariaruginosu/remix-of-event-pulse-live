import { useEffect, useMemo, useRef, useState } from "react";
import {
  Maximize2,
  X,
  RotateCw,
  Upload,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";

export type EventMapRole = "organizer" | "attendee";

type MapItem = { id: string; src: string; rotation: number; label: string };

const DEFAULT_MAP_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 220'>
    <rect width='320' height='220' fill='#f5f3ee'/>
    <g fill='none' stroke='#43214b' stroke-width='1.2' opacity='0.7'>
      <rect x='16' y='14' width='288' height='48' rx='4'/>
      <rect x='16' y='72' width='138' height='60' rx='4'/>
      <rect x='166' y='72' width='138' height='60' rx='4'/>
      <rect x='48' y='142' width='224' height='32' rx='4'/>
      <rect x='16' y='184' width='130' height='22' rx='4'/>
      <rect x='174' y='184' width='130' height='22' rx='4'/>
    </g>
    <g font-family='monospace' font-size='9' fill='#43214b'>
      <text x='160' y='42' text-anchor='middle'>MAIN STAGE</text>
      <text x='85' y='106' text-anchor='middle'>TRACK A</text>
      <text x='235' y='106' text-anchor='middle'>TRACK B</text>
      <text x='160' y='162' text-anchor='middle'>ATRIUM</text>
      <text x='81' y='198' text-anchor='middle'>COFFEE</text>
      <text x='239' y='198' text-anchor='middle'>LOUNGE</text>
    </g>
    <text x='160' y='216' text-anchor='middle' font-family='monospace' font-size='7' fill='#43214b' opacity='0.5'>↓ ENTRANCE</text>
  </svg>`
)}`;

function loadMaps(eventId: string): MapItem[] {
  try {
    const raw = localStorage.getItem(`event-maps:${eventId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as MapItem[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return [{ id: "default", src: DEFAULT_MAP_SVG, rotation: 0, label: "Floor 1" }];
}

function saveMaps(eventId: string, maps: MapItem[]) {
  try {
    localStorage.setItem(`event-maps:${eventId}`, JSON.stringify(maps));
  } catch {}
}

export function EventMap({
  eventId,
  role,
  title = "Venue map",
}: {
  eventId: string;
  role: EventMapRole;
  title?: string;
}) {
  const [maps, setMaps] = useState<MapItem[]>(() => loadMaps(eventId));
  const [activeIdx, setActiveIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveMaps(eventId, maps), [eventId, maps]);
  useEffect(() => {
    if (activeIdx >= maps.length) setActiveIdx(Math.max(0, maps.length - 1));
  }, [maps.length, activeIdx]);

  const active = maps[activeIdx];
  const isOrganizer = role === "organizer";

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
        update({ src, rotation: 0 });
      } else {
        setMaps((m) => [
          ...m,
          { id: crypto.randomUUID(), src, rotation: 0, label: `Floor ${m.length + 1}` },
        ]);
        setActiveIdx(maps.length);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeActive = () => {
    if (maps.length <= 1) return;
    setMaps((m) => m.filter((_, i) => i !== activeIdx));
  };

  const MapImage = useMemo(
    () =>
      function MapImage({ className = "" }: { className?: string }) {
        if (!active) return null;
        return (
          <img
            src={active.src}
            alt={active.label}
            draggable={false}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${className}`}
            style={{ transform: `rotate(${active.rotation}deg)` }}
          />
        );
      },
    [active]
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
                aria-label="Replace map"
              >
                <Upload className="size-3" />
              </button>
              <button
                onClick={rotate}
                className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                aria-label="Rotate map 90 degrees"
              >
                <RotateCw className="size-3" />
              </button>
            </>
          )}
          <button
            onClick={() => setFullscreen(true)}
            className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
            aria-label="Open map fullscreen"
          >
            <Maximize2 className="size-3" />
          </button>
        </div>
      </div>

      <div
        className="relative w-full rounded-2xl bg-foreground/[0.04] ring-1 ring-border overflow-hidden grid place-items-center p-3"
        style={{ aspectRatio: "16 / 11" }}
      >
        <MapImage />
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
              >
                <ArrowLeft className="size-3" />
              </button>
              <button
                onClick={() => move(1)}
                disabled={activeIdx >= maps.length - 1}
                className="p-1 rounded-md ring-1 ring-border disabled:opacity-30 hover:bg-foreground/5"
                aria-label="Move map right"
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
              >
                <Plus className="size-3" />
              </button>
              {maps.length > 1 && (
                <button
                  onClick={removeActive}
                  className="p-1 rounded-md ring-1 ring-border hover:bg-foreground/5 text-destructive"
                  aria-label="Remove current map"
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
            <MapImage />
          </div>
        </div>
      )}
    </div>
  );
}
