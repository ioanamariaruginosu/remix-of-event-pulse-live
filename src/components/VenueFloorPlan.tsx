import { motion } from "motion/react";
import { rooms } from "@/data/event";

// Floor-plan coordinates (normalized 0-100) + size for each room.
export const ROOM_LAYOUT: Record<string, { x: number; y: number; w: number; h: number }> = {
  main: { x: 8, y: 6, w: 84, h: 22 },
  "track-a": { x: 8, y: 32, w: 40, h: 22 },
  "track-b": { x: 52, y: 32, w: 40, h: 22 },
  atrium: { x: 22, y: 58, w: 56, h: 16 },
  coffee: { x: 8, y: 78, w: 36, h: 16 },
  lounge: { x: 56, y: 78, w: 36, h: 16 },
};

export function VenueFloorPlan({
  activeRoomId,
  onSelect,
  showLivePosition = false,
}: {
  activeRoomId?: string;
  onSelect?: (id: string) => void;
  showLivePosition?: boolean;
}) {
  const active = activeRoomId ? ROOM_LAYOUT[activeRoomId] : undefined;
  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-display italic text-foreground/40 uppercase tracking-widest">
        ↓ entrance
      </div>
      {showLivePosition && (
        <div className="absolute top-1.5 right-2 flex items-center gap-1.5 text-[9px] font-display italic text-primary bg-background/80 backdrop-blur px-1.5 py-0.5 rounded-full">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          live position
        </div>
      )}
      {rooms.map((r) => {
        const pos = ROOM_LAYOUT[r.id];
        if (!pos) return null;
        const isActive = r.id === activeRoomId;
        const isSocial = r.kind === "social";
        const Tag = onSelect ? "button" : "div";
        return (
          <Tag
            key={r.id}
            onClick={onSelect ? () => onSelect(r.id) : undefined}
            className={`absolute rounded-lg flex flex-col items-center justify-center text-center px-1.5 transition-all ${
              isActive
                ? "bg-primary text-white shadow-lg ring-2 ring-primary z-10"
                : isSocial
                  ? "bg-accent/30 text-foreground/70 ring-1 ring-accent/40"
                  : "bg-foreground/8 text-foreground/60 ring-1 ring-border"
            } ${onSelect && !isActive ? (isSocial ? "hover:bg-accent/50" : "hover:bg-foreground/15") : ""}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${pos.w}%`,
              height: `${pos.h}%`,
            }}
          >
            <div className="text-[9px] font-bold uppercase tracking-wider leading-tight truncate w-full">
              {r.name}
            </div>
            <div className={`text-[8px] mt-0.5 ${isActive ? "text-white/70" : "text-foreground/40"}`}>
              {r.current}/{r.capacity}
            </div>
          </Tag>
        );
      })}
      {showLivePosition && active && (
        <motion.div
          className="absolute pointer-events-none z-20"
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
  );
}
