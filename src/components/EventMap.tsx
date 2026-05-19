import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion } from "motion/react";
import { Maximize2, X, RotateCw, Move, RotateCcw, MousePointer2, Locate } from "lucide-react";
import { rooms as defaultRooms, type Room } from "@/data/event";

export type EventMapRole = "organizer" | "attendee";

type Layout = { x: number; y: number; w: number; h: number; rotation: number };

// Sensible default layout for the seeded rooms. Unknown rooms get auto-placed.
const SEED_LAYOUT: Record<string, Layout> = {
  main: { x: 8, y: 6, w: 84, h: 22, rotation: 0 },
  "track-a": { x: 8, y: 32, w: 40, h: 22, rotation: 0 },
  "track-b": { x: 52, y: 32, w: 40, h: 22, rotation: 0 },
  atrium: { x: 22, y: 58, w: 56, h: 16, rotation: 0 },
  coffee: { x: 8, y: 78, w: 36, h: 16, rotation: 0 },
  lounge: { x: 56, y: 78, w: 36, h: 16, rotation: 0 },
};

function defaultFor(roomId: string, idx: number): Layout {
  if (SEED_LAYOUT[roomId]) return SEED_LAYOUT[roomId];
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  return { x: col * 32 + 4, y: row * 28 + 4, w: 28, h: 22, rotation: 0 };
}

function reconcile(rooms: Room[], saved: Record<string, Layout>): Record<string, Layout> {
  const next: Record<string, Layout> = {};
  rooms.forEach((r, i) => {
    next[r.id] = saved[r.id] ?? defaultFor(r.id, i);
  });
  return next;
}

function loadLayouts(eventId: string): Record<string, Layout> {
  try {
    const raw = localStorage.getItem(`venue-map:${eventId}`);
    if (raw) return JSON.parse(raw) as Record<string, Layout>;
  } catch {
    return {};
  }
  return {};
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

type Viewport = { tx: number; ty: number; scale: number; rot: number };
const IDENTITY_VP: Viewport = { tx: 0, ty: 0, scale: 1, rot: 0 };

// Screen (canvas-local) → world (untransformed canvas) coords.
function screenToWorld(p: { x: number; y: number }, vp: Viewport) {
  const r = (vp.rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const dx = (p.x - vp.tx) / vp.scale;
  const dy = (p.y - vp.ty) / vp.scale;
  return { x: cos * dx + sin * dy, y: -sin * dx + cos * dy };
}

export function EventMap({
  eventId,
  role,
  title = "You are here",
  rooms = defaultRooms,
  activeRoomId,
  onSelectRoom,
  showLivePosition = false,
}: {
  eventId: string;
  role: EventMapRole;
  title?: string;
  rooms?: Room[];
  activeRoomId?: string;
  onSelectRoom?: (id: string) => void;
  showLivePosition?: boolean;
}) {
  const isOrganizer = role === "organizer";

  // SSR-safe init from defaults; hydrate from storage after mount.
  const [layouts, setLayouts] = useState<Record<string, Layout>>(() => reconcile(rooms, {}));
  const [hydrated, setHydrated] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setLayouts(reconcile(rooms, loadLayouts(eventId)));
    setHydrated(true);
  }, [eventId, rooms]);

  // Editing auto-expands the map to fullscreen; exiting edit returns to inline.
  useEffect(() => {
    setFullscreen(editing);
  }, [editing]);

  // Persist when organizer changes layouts.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(`venue-map:${eventId}`, JSON.stringify(layouts));
    } catch {
      void 0;
    }
  }, [layouts, eventId, hydrated]);

  // Cross-tab sync so attendees pick up organizer edits.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === `venue-map:${eventId}` && e.newValue) {
        try {
          setLayouts(reconcile(rooms, JSON.parse(e.newValue)));
        } catch {
          setLayouts(reconcile(rooms, {}));
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [eventId, rooms]);

  const update = (id: string, patch: Partial<Layout>) =>
    setLayouts((m) => ({ ...m, [id]: { ...m[id], ...patch } }));

  const resetAll = () => setLayouts(reconcile(rooms, {}));

  const Map = (
    <VenueMapCanvas
      rooms={rooms}
      layouts={layouts}
      isOrganizer={isOrganizer}
      editing={editing}
      selectedId={selectedId}
      onSelect={(id) => {
        setSelectedId(id);
        if (!editing) onSelectRoom?.(id);
      }}
      onUpdate={update}
      activeRoomId={activeRoomId}
      showLivePosition={showLivePosition && !editing}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="text-[9px] font-display italic text-foreground/40 uppercase tracking-widest truncate">
          {title}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isOrganizer && (
            <>
              <button
                onClick={() => setEditing((v) => !v)}
                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ring-1 ${
                  editing
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "ring-border hover:bg-foreground/5"
                }`}
                aria-label={editing ? "Done editing" : "Edit layout"}
                title={editing ? "Done editing" : "Edit layout"}
              >
                {editing ? <MousePointer2 className="size-3" /> : <Move className="size-3" />}
              </button>
              {editing && selectedId && (
                <button
                  onClick={() =>
                    update(selectedId, {
                      rotation: ((layouts[selectedId]?.rotation ?? 0) + 90) % 360,
                    })
                  }
                  className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                  aria-label="Rotate selected room"
                  title="Rotate 90°"
                >
                  <RotateCw className="size-3" />
                </button>
              )}
              {editing && (
                <button
                  onClick={resetAll}
                  className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                  aria-label="Reset layout"
                  title="Reset"
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
        className="relative w-full rounded-2xl bg-foreground/[0.04] ring-1 ring-border overflow-hidden"
        style={{ aspectRatio: "16 / 11" }}
      >
        {Map}
      </div>

      {isOrganizer && editing && selectedId && layouts[selectedId] && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg ring-1 ring-border bg-foreground/[0.02]">
          <RotateCw className="size-3 text-foreground/50 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 shrink-0">
            Rotate
          </span>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={Math.round(layouts[selectedId].rotation ?? 0)}
            onChange={(e) => update(selectedId, { rotation: Number(e.target.value) })}
            className="flex-1 accent-primary"
            aria-label="Rotate selected room (degrees)"
          />
          <input
            type="number"
            min={0}
            max={359}
            value={Math.round(layouts[selectedId].rotation ?? 0)}
            onChange={(e) =>
              update(selectedId, {
                rotation: ((Number(e.target.value) % 360) + 360) % 360,
              })
            }
            className="w-14 px-1.5 py-0.5 text-xs text-right tabular-nums rounded ring-1 ring-border bg-background"
            aria-label="Rotation degrees"
          />
          <span className="text-[10px] text-foreground/50">°</span>
          <button
            onClick={() => update(selectedId, { rotation: 0 })}
            className="px-1.5 py-0.5 rounded ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
            aria-label="Reset rotation"
          >
            0°
          </button>
        </div>
      )}

      {isOrganizer && editing && (
        <div className="mt-2 text-[10px] text-foreground/50 leading-snug">
          Drag rooms to move · drag the bottom-right corner to resize · select a room to rotate by
          any angle · changes are live for attendees.
        </div>
      )}
      {fullscreen && (
        <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/60">
              {title} {editing && <span className="text-primary">· editing</span>}
            </div>
            <div className="flex items-center gap-1">
              {isOrganizer && editing && selectedId && (
                <button
                  onClick={() =>
                    update(selectedId, {
                      rotation: ((layouts[selectedId]?.rotation ?? 0) + 90) % 360,
                    })
                  }
                  className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                  title="Rotate 90°"
                >
                  <RotateCw className="size-3" />
                </button>
              )}
              {isOrganizer && editing && (
                <button
                  onClick={resetAll}
                  className="px-2 py-1 rounded-md ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                  title="Reset"
                >
                  <RotateCcw className="size-3" />
                </button>
              )}
            <button
              onClick={() => {
                setEditing(false);
                setFullscreen(false);
              }}
              className="size-9 grid place-items-center rounded-full ring-1 ring-border hover:bg-foreground/5"
              aria-label={editing ? "Done editing" : "Close fullscreen"}
              title={editing ? "Done" : "Close"}
            >
              <X className="size-4" />
            </button>
            </div>
          </div>
          <div className="flex-1 grid place-items-center p-4 sm:p-8 overflow-auto">
            <div className="w-full max-w-6xl space-y-3">
              <div
                className="relative w-full rounded-2xl bg-foreground/[0.04] ring-1 ring-border overflow-hidden"
                style={{ aspectRatio: "16 / 11" }}
              >
                <VenueMapCanvas
                  rooms={rooms}
                  layouts={layouts}
                  isOrganizer={isOrganizer}
                  editing={editing}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    if (!editing) onSelectRoom?.(id);
                  }}
                  onUpdate={update}
                  activeRoomId={activeRoomId}
                  showLivePosition={showLivePosition && !editing}
                />
              </div>
              {isOrganizer && editing && selectedId && layouts[selectedId] && (
                <div className="flex items-center gap-2 p-2 rounded-lg ring-1 ring-border bg-foreground/[0.02]">
                  <RotateCw className="size-3 text-foreground/50 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 shrink-0">
                    Rotate
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={359}
                    step={1}
                    value={Math.round(layouts[selectedId].rotation ?? 0)}
                    onChange={(e) => update(selectedId, { rotation: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <input
                    type="number"
                    min={0}
                    max={359}
                    value={Math.round(layouts[selectedId].rotation ?? 0)}
                    onChange={(e) =>
                      update(selectedId, {
                        rotation: ((Number(e.target.value) % 360) + 360) % 360,
                      })
                    }
                    className="w-14 px-1.5 py-0.5 text-xs text-right tabular-nums rounded ring-1 ring-border bg-background"
                  />
                  <span className="text-[10px] text-foreground/50">°</span>
                  <button
                    onClick={() => update(selectedId, { rotation: 0 })}
                    className="px-1.5 py-0.5 rounded ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                  >
                    0°
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VenueMapCanvas({
  rooms,
  layouts,
  isOrganizer,
  editing,
  selectedId,
  onSelect,
  onUpdate,
  activeRoomId,
  showLivePosition,
}: {
  rooms: Room[];
  layouts: Record<string, Layout>;
  isOrganizer: boolean;
  editing: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Layout>) => void;
  activeRoomId?: string;
  showLivePosition?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    start: Layout;
    overflowLeft: number;
    overflowRight: number;
    overflowTop: number;
    overflowBottom: number;
  } | null>(null);

  // View transform (pan/zoom/rotate of the entire map).
  const [vp, setVp] = useState<Viewport>(IDENTITY_VP);
  const vpRef = useRef<Viewport>(IDENTITY_VP);
  useEffect(() => {
    vpRef.current = vp;
  }, [vp]);

  // Multitouch gesture state.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureRef = useRef<{
    startVp: Viewport;
    startDist: number;
    startAngle: number;
    startMid: { x: number; y: number }; // canvas-local
    worldPivot: { x: number; y: number }; // world coords under startMid
    panPointerId?: number;
    panStart?: { x: number; y: number };
  } | null>(null);

  const getLocal = (e: ReactPointerEvent | PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const beginGestureFromPointers = () => {
    const pts = Array.from(pointersRef.current.values());
    if (pts.length === 2) {
      const [a, b] = pts;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const startVp = vpRef.current;
      gestureRef.current = {
        startVp,
        startDist: dist,
        startAngle: angle,
        startMid: mid,
        worldPivot: screenToWorld(mid, startVp),
      };
    } else if (pts.length === 1) {
      const [only] = pts;
      const id = Array.from(pointersRef.current.keys())[0];
      gestureRef.current = {
        startVp: vpRef.current,
        startDist: 0,
        startAngle: 0,
        startMid: only,
        worldPivot: { x: 0, y: 0 },
        panPointerId: id,
        panStart: only,
      };
    }
  };

  const onCanvasPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // If editing a room, don't start map gesture from a 2nd finger — keeps
    // single-finger drag predictable.
    if (dragRef.current) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, getLocal(e));
    beginGestureFromPointers();
  };

  const onCanvasPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const local = getLocal(e);
    pointersRef.current.set(e.pointerId, local);
    const g = gestureRef.current;
    if (!g) return;
    const pts = Array.from(pointersRef.current.values());
    if (pts.length >= 2) {
      const [a, b] = pts;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const scale = clamp(g.startVp.scale * (dist / g.startDist), 0.4, 6);
      const rot = g.startVp.rot + (angle - g.startAngle);
      // Keep worldPivot pinned under mid.
      const r = (rot * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const tx = mid.x - (cos * g.worldPivot.x - sin * g.worldPivot.y) * scale;
      const ty = mid.y - (sin * g.worldPivot.x + cos * g.worldPivot.y) * scale;
      setVp({ tx, ty, scale, rot });
    } else if (pts.length === 1 && g.panStart && g.panPointerId === e.pointerId) {
      const ddx = local.x - g.panStart.x;
      const ddy = local.y - g.panStart.y;
      setVp({
        ...g.startVp,
        tx: g.startVp.tx + ddx,
        ty: g.startVp.ty + ddy,
      });
    }
  };

  const onCanvasPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      void 0;
    }
    if (pointersRef.current.size === 0) {
      gestureRef.current = null;
    } else {
      // Re-anchor the remaining gesture (e.g., went from 2→1 pointer).
      beginGestureFromPointers();
    }
  };

  // Desktop wheel-to-zoom around cursor.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mid = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const cur = vpRef.current;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const scale = clamp(cur.scale * factor, 0.4, 6);
      const world = screenToWorld(mid, cur);
      const r = (cur.rot * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const tx = mid.x - (cos * world.x - sin * world.y) * scale;
      const ty = mid.y - (sin * world.x + cos * world.y) * scale;
      setVp({ ...cur, scale, tx, ty });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const resetView = () => setVp(IDENTITY_VP);

  const onPointerDown =
    (id: string, mode: "move" | "resize") => (e: ReactPointerEvent<HTMLElement>) => {
      if (!isOrganizer || !editing) return;
      e.stopPropagation();
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      onSelect(id);
      const layout = layouts[id];
      dragRef.current = {
        id,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        start: { ...layout },
        overflowLeft: 0,
        overflowRight: 0,
        overflowTop: 0,
        overflowBottom: 0,
      };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    // Convert screen delta → world delta (account for view rotation/scale).
    const sdx = e.clientX - d.startX;
    const sdy = e.clientY - d.startY;
    const vr = (vpRef.current.rot * Math.PI) / 180;
    const vcos = Math.cos(vr);
    const vsin = Math.sin(vr);
    const wdx = (vcos * sdx + vsin * sdy) / vpRef.current.scale;
    const wdy = (-vsin * sdx + vcos * sdy) / vpRef.current.scale;
    const dxPct = (wdx / rect.width) * 100;
    const dyPct = (wdy / rect.height) * 100;
    if (d.mode === "move") {
      const x = clamp(Math.round((d.start.x + dxPct) * 10) / 10, 0, 100 - d.start.w);
      const y = clamp(Math.round((d.start.y + dyPct) * 10) / 10, 0, 100 - d.start.h);
      onUpdate(d.id, { x, y });
    } else {
      // Rotate the pointer delta into the room's local (unrotated) frame so
      // dragging the bottom-right handle always grows w/h along the room's
      // own axes, regardless of rotation.
      const rot = ((d.start.rotation ?? 0) * Math.PI) / 180;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const localDxPct = dxPct * cos + dyPct * sin;
      const localDyPct = -dxPct * sin + dyPct * cos;
      const w = clamp(Math.round(d.start.w + localDxPct), 8, 100 - d.start.x);
      const h = clamp(Math.round(d.start.h + localDyPct), 6, 100 - d.start.y);
      onUpdate(d.id, { w, h });
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      void 0;
    }
  };

  const active = activeRoomId ? layouts[activeRoomId] : undefined;

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 select-none touch-none"
      onPointerDown={onCanvasPointerDown}
      onPointerMove={(e) => {
        if (dragRef.current) onPointerMove(e);
        onCanvasPointerMove(e);
      }}
      onPointerUp={(e) => {
        if (dragRef.current) onPointerUp(e);
        onCanvasPointerUp(e);
      }}
      onPointerCancel={(e) => {
        if (dragRef.current) onPointerUp(e);
        onCanvasPointerUp(e);
      }}
    >
      {/* World layer — pan/zoom/rotate transform */}
      <div
        className="absolute inset-0"
        style={{
          transformOrigin: "0 0",
          transform: `translate(${vp.tx}px, ${vp.ty}px) rotate(${vp.rot}deg) scale(${vp.scale})`,
          willChange: "transform",
        }}
      >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.08] text-foreground"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />

      {/* Entrance label */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-display italic text-foreground/40 uppercase tracking-widest pointer-events-none">
        ↓ entrance
      </div>

      {/* Live position pill */}
      {showLivePosition && (
        <div className="absolute top-1.5 right-2 flex items-center gap-1.5 text-[9px] font-display italic text-primary bg-background/80 backdrop-blur px-1.5 py-0.5 rounded-full pointer-events-none">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          live position
        </div>
      )}

      {/* Rooms */}
      {rooms.map((r) => {
        const pos = layouts[r.id];
        if (!pos) return null;
        const isActive = r.id === activeRoomId;
        const isSelected = selectedId === r.id && editing;
        const isSocial = r.kind === "social";
        return (
          <div
            key={r.id}
            onPointerDown={editing ? onPointerDown(r.id, "move") : undefined}
            onClick={editing ? undefined : () => onSelect(r.id)}
            role="button"
            tabIndex={0}
            className={`absolute rounded-lg flex flex-col items-center justify-center text-center px-1.5 transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary z-10"
                : isSocial
                  ? "bg-accent/30 text-foreground/70 ring-1 ring-accent/40"
                  : "bg-foreground/10 text-foreground/70 ring-1 ring-border"
            } ${isSelected ? "outline outline-2 outline-offset-2 outline-primary z-20" : ""} ${
              editing ? "cursor-move" : "cursor-pointer hover:brightness-105"
            }`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${pos.w}%`,
              height: `${pos.h}%`,
              transform: `rotate(${pos.rotation ?? 0}deg)`,
              transformOrigin: "center",
            }}
          >
            <div className="text-[9px] font-bold uppercase tracking-wider leading-tight truncate w-full">
              {r.name}
            </div>
            <div
              className={`text-[8px] mt-0.5 ${
                isActive ? "text-primary-foreground/70" : "text-foreground/40"
              }`}
            >
              {r.current}/{r.capacity}
            </div>
            {isSelected && (
              <div
                onPointerDown={onPointerDown(r.id, "resize")}
                className="absolute -right-1.5 -bottom-1.5 size-3.5 rounded-sm bg-primary ring-2 ring-background cursor-nwse-resize touch-none"
                aria-label="Resize"
              />
            )}
          </div>
        );
      })}

      {/* You-are-here pulse */}
      {showLivePosition && active && activeRoomId && (
        <motion.div
          className="absolute pointer-events-none z-30"
          style={{
            left: `${active.x + active.w / 2}%`,
            top: `${active.y + active.h / 2}%`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          key={activeRoomId}
        >
          <span className="absolute inset-0 size-4 rounded-full bg-white/60 animate-ping" />
          <span className="relative block size-4 rounded-full bg-white ring-2 ring-primary shadow-lg" />
        </motion.div>
      )}
      </div>

      {/* Reset-view button (only when transform is not identity) */}
      {(vp.tx !== 0 || vp.ty !== 0 || vp.scale !== 1 || vp.rot !== 0) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            resetView();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1.5 left-1.5 z-40 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur ring-1 ring-border text-[9px] font-bold uppercase tracking-widest hover:bg-background"
          aria-label="Reset map view"
        >
          <Locate className="size-3" />
          Reset
        </button>
      )}
    </div>
  );
}
