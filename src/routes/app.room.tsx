import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { Avatar } from "@/components/Avatar";
import { RoomPhotos } from "@/components/RoomPhotos";
import { LiveChat } from "@/components/LiveChat";
import { EventMap } from "@/components/EventMap";
import { people, rooms, sessions } from "@/data/event";

export const Route = createFileRoute("/app/room")({
  head: () => ({ meta: [{ title: "Room — synqmap" }] }),
  component: RoomView,
});

function RoomView() {
  const [roomId, setRoomId] = useState("track-a");
  const room = rooms.find((r) => r.id === roomId)!;
  const here = people.filter((p) => p.roomId === roomId && p.id !== "you");
  const session = sessions.find((s) => s.roomId === roomId);

  return (
    <div className="px-5 pt-6 space-y-5">
      <div className="bg-primary text-white -mx-5 -mt-6 px-5 pt-4 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-display italic tracking-tight normal-case text-white/60">
          <span className="size-1.5 bg-white rounded-full animate-pulse" />
          BLE detected · located via beacons
        </div>
        <div className="font-extrabold text-2xl tracking-tight mt-1">{room.name}</div>
        <div className="text-xs text-white/70">
          {room.current} people here · {Math.round((room.current / room.capacity) * 100)}% full
        </div>
      </div>

      <div>
        <div className="text-[9px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">Switch room (demo)</div>
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoomId(r.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap uppercase tracking-widest ${
                roomId === r.id ? "bg-foreground text-white" : "bg-foreground/5 text-foreground/60"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <VenueMiniMap activeRoomId={roomId} onSelect={setRoomId} />

      <EventMap eventId="current" role="attendee" title="Venue map" />



      <div className="aspect-square bg-foreground rounded-2xl overflow-hidden">
        <NetworkGraph scale="room" roomId={roomId} height={320} showLabels />
      </div>

      {session && (
        <div className="p-4 ring-1 ring-border rounded-2xl">
          <div className="text-[9px] font-display italic text-primary font-bold uppercase tracking-widest mb-1">Now on stage</div>
          <div className="font-bold tracking-tight">{session.title}</div>
          <div className="text-xs text-foreground/60 mt-1">{session.speaker} · {session.time}</div>
          <Link to="/app/brief" className="mt-3 inline-block text-xs font-bold text-primary">View live brief →</Link>
        </div>
      )}

      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-3">Who you should meet here</div>
        <div className="space-y-2">
          {here.slice(0, 5).map((p, i) => (
            <div key={p.id} className={`p-3 rounded-xl flex items-center gap-3 ${i === 0 ? "bg-primary-soft ring-1 ring-primary/20" : "ring-1 ring-border"}`}>
              <Avatar person={p} size={40} className="ring-2 ring-background shadow-sm" />

              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{p.name}</div>
                <div className="text-[10px] text-foreground/50 truncate">{p.intent}</div>
              </div>
              {i === 0 && (
                <div className="text-[9px] font-display italic font-bold text-primary uppercase tracking-widest italic">Match</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <LiveChat roomId={roomId} />

      <RoomPhotos roomId={roomId} />
    </div>
  );
}

// Floor-plan coordinates (normalized 0-100) + size for each room.
// Roughly matches a venue with main stage at top, two tracks side-by-side,
// atrium in the middle, and social spaces at the bottom.
const ROOM_LAYOUT: Record<string, { x: number; y: number; w: number; h: number }> = {
  main:    { x: 8,  y: 6,  w: 84, h: 22 },
  "track-a": { x: 8,  y: 32, w: 40, h: 22 },
  "track-b": { x: 52, y: 32, w: 40, h: 22 },
  atrium:  { x: 22, y: 58, w: 56, h: 16 },
  coffee:  { x: 8,  y: 78, w: 36, h: 16 },
  lounge:  { x: 56, y: 78, w: 36, h: 16 },
};

function VenueMiniMap({
  activeRoomId,
  onSelect,
}: {
  activeRoomId: string;
  onSelect: (id: string) => void;
}) {
  const active = ROOM_LAYOUT[activeRoomId];
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] font-display italic text-foreground/40 uppercase tracking-widest">
          You are here · Floor 1
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-display italic text-primary">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          live position
        </div>
      </div>
      <div
        className="relative w-full rounded-2xl bg-foreground/[0.04] ring-1 ring-border overflow-hidden"
        style={{ aspectRatio: "16 / 11" }}
      >
        {/* Faint grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        />

        {/* Entrance label */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-display italic text-foreground/40 uppercase tracking-widest">
          ↓ entrance
        </div>

        {/* Rooms */}
        {rooms.map((r) => {
          const pos = ROOM_LAYOUT[r.id];
          if (!pos) return null;
          const isActive = r.id === activeRoomId;
          const isSocial = r.kind === "social";
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={`absolute rounded-lg flex flex-col items-center justify-center text-center px-1.5 transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg ring-2 ring-primary z-10"
                  : isSocial
                    ? "bg-accent/30 text-foreground/70 hover:bg-accent/50 ring-1 ring-accent/40"
                    : "bg-foreground/8 text-foreground/60 hover:bg-foreground/15 ring-1 ring-border"
              }`}
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
            </button>
          );
        })}

        {/* You-are-here pulse on active room */}
        {active && (
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
    </div>
  );
}
