import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { rooms, people } from "@/data/event";
import { Avatar } from "@/components/Avatar";
import {
  tapInAttendee,
  tapOutAttendee,
  useMembership,
  useRecentTaps,
  useRoomCount,
} from "@/data/presence";
import { NetworkGraph } from "@/components/NetworkGraph";

export const Route = createFileRoute("/organizer/door")({
  head: () => ({ meta: [{ title: "Organizer · Door check-in — synqmap" }] }),
  component: Door,
});

function Door() {
  const [roomId, setRoomId] = useState<string>(rooms[0].id);
  const [pulseKey, setPulseKey] = useState(0);
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === roomId)!;
  const count = useRoomCount(roomId);
  const recent = useRecentTaps(roomId).slice(0, 8);
  const membership = useMembership();

  // Eligible attendees = anyone not currently in this room
  const queue = useMemo(
    () => people.filter((p) => p.id !== "you" && membership.get(p.id) !== roomId),
    [membership, roomId],
  );

  const selected = selectedId ? people.find((p) => p.id === selectedId) ?? null : null;

  const confirmTap = () => {
    if (!selected) return;
    tapInAttendee(selected.id, roomId, "organizer-1");
    setLastTapped(selected.id);
    setPulseKey((k) => k + 1);
    setSelectedId(null);
  };

  // Simulate: queue up a random attendee (does NOT sign them in)
  const simulateScan = () => {
    const next = queue[Math.floor(Math.random() * Math.min(queue.length, 8))];
    if (next) setSelectedId(next.id);
  };

  return (
    <div className="p-5 lg:p-12 max-w-6xl space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
            Door staff
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Check-in</h1>
          <p className="text-foreground/60 mt-2 max-w-xl">
            Pick the attendee whose phone is at the reader, then tap the pad to sign them into the room. The graph updates instantly.
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 rounded-xl ring-1 ring-border overflow-x-auto max-w-full">
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoomId(r.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
                r.id === roomId
                  ? "bg-foreground text-white"
                  : "text-foreground/60 hover:bg-foreground/5"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        {/* Big tap surface */}
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-border bg-foreground text-white p-8 min-h-[460px] flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display italic text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Now at the door
              </div>
              <div className="text-2xl font-extrabold tracking-tight">{room.name}</div>
              <div className="text-xs text-white/50 mt-1">{room.kind} · capacity {room.capacity}</div>
            </div>
            <div className="text-right">
              <div className="font-display italic text-5xl font-extrabold tracking-tight">{count}</div>
              <div className="font-display italic text-[10px] uppercase tracking-widest text-white/40">
                inside now
              </div>
            </div>
          </div>

          {/* Selected attendee strip */}
          <div className="mt-6 rounded-2xl ring-1 ring-white/10 bg-white/[0.04] p-3 flex items-center gap-3 min-h-[68px]">
            {selected ? (
              <>
                <Avatar person={selected} size={44} className="ring-2 ring-white/20" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{selected.name}</div>
                  <div className="text-[11px] text-white/50 truncate">{selected.oneLiner}</div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-[10px] font-display italic text-white/40 hover:text-white px-2"
                >
                  clear
                </button>
              </>
            ) : (
              <div className="text-[11px] text-white/40 font-display italic px-1">
                No phone detected — pick an attendee from the roster or scan
              </div>
            )}
          </div>

          {/* NFC pulse target */}
          <div className="flex-1 grid place-items-center relative">
            <AnimatePresence>
              {selected && [0, 1, 2].map((i) => (
                <motion.div
                  key={`${pulseKey}-${i}`}
                  className="absolute rounded-full border border-accent"
                  initial={{ width: 90, height: 90, opacity: 0.7 }}
                  animate={{ width: 320, height: 320, opacity: 0 }}
                  transition={{ duration: 1.6, delay: i * 0.25, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>
            <motion.button
              key={`core-${pulseKey}`}
              onClick={confirmTap}
              disabled={!selected}
              initial={{ scale: 0.9 }}
              animate={{ scale: selected ? [0.9, 1.05, 1] : 1 }}
              transition={{ duration: 0.5 }}
              className={`size-32 rounded-full grid place-items-center font-display italic font-bold text-center leading-tight transition ${
                selected
                  ? "bg-accent text-foreground shadow-[0_0_60px_rgba(190,242,100,0.5)] hover:scale-[1.03] cursor-pointer"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              }`}
            >
              <div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">
                  {selected ? "tap to" : "waiting"}
                </div>
                <div className="text-2xl">{selected ? "sign in" : "—"}</div>
              </div>
            </motion.button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-display italic uppercase tracking-widest text-white/40">
              NFC · BLE · QR fallback
            </div>
            <button
              onClick={simulateScan}
              className="px-4 py-2 bg-accent text-foreground rounded-xl font-bold text-xs hover:scale-[1.02] transition-transform"
            >
              Simulate scan ↺
            </button>
          </div>
        </div>


        {/* Live feed + queue */}
        <div className="space-y-4">
          <section className="p-5 rounded-3xl ring-1 ring-border bg-background">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40">
                Just signed in
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-display italic text-primary">
                <span className="size-1.5 bg-primary rounded-full animate-pulse" />
                live
              </span>
            </div>
            <AnimatePresence initial={false}>
              {recent.length === 0 && (
                <div className="text-xs text-foreground/40 py-6 text-center font-display italic">
                  No taps yet. Hand a phone over and tap.
                </div>
              )}
              {recent.map((t) => {
                const p = people.find((pp) => pp.id === t.personId);
                if (!p) return null;
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-b-0"
                  >
                    <div className="shrink-0" style={{ filter: `drop-shadow(0 0 10px ${p.color}66)` }}>
                      <Avatar person={p} size={36} className="ring-2 ring-background" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{p.name}</div>
                      <div className="text-[11px] text-foreground/40 truncate">{p.oneLiner}</div>
                    </div>
                    <button
                      onClick={() => tapOutAttendee(p.id)}
                      className="text-[10px] font-display italic text-foreground/40 hover:text-destructive"
                    >
                      undo
                    </button>
                    <div className="text-[10px] font-display italic text-foreground/40 w-12 text-right">
                      {timeAgo(t.at)}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </section>

          <section className="p-5 rounded-3xl ring-1 ring-border bg-background">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40">
                Pick from roster
              </div>
              <div className="text-[10px] text-foreground/40">{queue.length} eligible</div>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {queue.slice(0, 24).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`group flex flex-col items-center gap-1 p-2 rounded-xl ring-1 transition ${
                    selectedId === p.id
                      ? "ring-primary bg-primary-soft"
                      : lastTapped === p.id
                      ? "ring-primary/40"
                      : "ring-border hover:ring-primary/40 hover:bg-foreground/[0.02]"
                  }`}
                >
                  <Avatar person={p} size={36} className="ring-2 ring-border" />

                  <div className="text-[10px] font-bold truncate w-full text-center">
                    {p.name.split(" ")[0]}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Live graph */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40">
            Live graph · {room.name}
          </div>
          <div className="text-[10px] text-foreground/40 font-display italic">
            {count} nodes · updates with every tap
          </div>
        </div>
        <div className="rounded-3xl overflow-hidden ring-1 ring-border bg-foreground h-[420px] relative">
          <NetworkGraph scale="room" roomId={roomId} height={420} variant="dark" interactive />
        </div>
      </section>
    </div>
  );
}

function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}
