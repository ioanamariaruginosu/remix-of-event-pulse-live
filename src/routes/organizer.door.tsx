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

type Phase = "idle" | "detecting" | "reading" | "confirmed";

function Door() {
  const [roomId, setRoomId] = useState<string>(rooms[0].id);
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const [signal, setSignal] = useState(0); // 0..1 — animated "field strength"
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const room = rooms.find((r) => r.id === roomId)!;
  const count = useRoomCount(roomId);
  const recent = useRecentTaps(roomId).slice(0, 8);
  const membership = useMembership();

  // Eligible attendees = anyone not currently in this room
  const queue = useMemo(
    () => people.filter((p) => p.id !== "you" && membership.get(p.id) !== roomId),
    [membership, roomId],
  );

  const active = activeId ? people.find((p) => p.id === activeId) ?? null : null;

  // Cleanup any pending timers on unmount / re-runs
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  const runScan = (personId: string) => {
    // Reset
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActiveId(personId);

    // Phase 1: detecting (field rises)
    setPhase("detecting");
    setSignal(0.35);
    timers.current.push(
      setTimeout(() => {
        // Phase 2: reading credentials
        setPhase("reading");
        setSignal(0.75);
      }, 450),
    );
    timers.current.push(
      setTimeout(() => {
        // Phase 3: confirmed → commit
        setPhase("confirmed");
        setSignal(1);
        tapInAttendee(personId, roomId, "organizer-1");
        setLastTapped(personId);
      }, 1100),
    );
    timers.current.push(
      setTimeout(() => {
        // Back to idle
        setPhase("idle");
        setSignal(0);
        setActiveId(null);
      }, 2200),
    );
  };

  const simulateScan = () => {
    if (phase !== "idle") return;
    const next = queue[Math.floor(Math.random() * Math.min(queue.length, 8))];
    if (next) runScan(next.id);
  };

  const phaseCopy: Record<Phase, { hint: string; status: string; statusColor: string }> = {
    idle: { hint: "Hold phone near reader", status: "Scanning", statusColor: "text-white/40" },
    detecting: { hint: "Phone detected", status: "Detecting", statusColor: "text-accent" },
    reading: { hint: "Reading credentials…", status: "Authenticating", statusColor: "text-accent" },
    confirmed: { hint: "Signed in ✓", status: "Confirmed", statusColor: "text-emerald-400" },
  };
  const copy = phaseCopy[phase];

  return (
    <div className="p-5 lg:p-12 max-w-6xl space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
            Door staff
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Check-in</h1>
          <p className="text-foreground/60 mt-2 max-w-xl">
            The reader is always scanning. When an attendee holds their phone near it, their credentials are read over NFC and they're signed into the room.
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
        {/* NFC Reader */}
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-border bg-foreground text-white p-8 min-h-[520px] flex flex-col">
          {/* ambient scanline */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
            animate={{ y: [0, 520, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          <div className="flex items-start justify-between relative">
            <div>
              <div className="font-display italic text-[10px] uppercase tracking-widest text-white/50 mb-1">
                NFC reader · door
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

          {/* Status bar */}
          <div className="mt-5 flex items-center justify-between text-[10px] font-display italic uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <motion.span
                className={`size-1.5 rounded-full ${
                  phase === "idle" ? "bg-white/40" : phase === "confirmed" ? "bg-emerald-400" : "bg-accent"
                }`}
                animate={{ opacity: phase === "idle" ? [0.3, 1, 0.3] : 1 }}
                transition={{ duration: 1.4, repeat: phase === "idle" ? Infinity : 0 }}
              />
              <span className={copy.statusColor}>{copy.status}</span>
            </div>
            {/* Signal strength bars */}
            <div className="flex items-end gap-0.5 h-3">
              {[0.25, 0.5, 0.75, 1].map((threshold, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-sm bg-accent"
                  animate={{
                    height: signal >= threshold ? `${4 + i * 3}px` : "2px",
                    opacity: signal >= threshold ? 1 : 0.15,
                  }}
                  transition={{ duration: 0.25 }}
                />
              ))}
            </div>
          </div>

          {/* NFC pulse target */}
          <div className="flex-1 grid place-items-center relative my-6">
            {/* ambient idle rings — always scanning */}
            {phase === "idle" && [0, 1].map((i) => (
              <motion.div
                key={`idle-${i}`}
                className="absolute rounded-full border border-white/10"
                initial={{ width: 140, height: 140, opacity: 0 }}
                animate={{ width: 280, height: 280, opacity: [0, 0.4, 0] }}
                transition={{ duration: 2.6, delay: i * 1.3, repeat: Infinity, ease: "easeOut" }}
              />
            ))}

            {/* active detection rings */}
            <AnimatePresence>
              {(phase === "detecting" || phase === "reading") &&
                [0, 1, 2].map((i) => (
                  <motion.div
                    key={`${phase}-${i}`}
                    className="absolute rounded-full border-2 border-accent"
                    initial={{ width: 110, height: 110, opacity: 0.8 }}
                    animate={{ width: 340, height: 340, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, delay: i * 0.18, repeat: Infinity, ease: "easeOut" }}
                  />
                ))}
            </AnimatePresence>

            {/* confirmed burst */}
            {phase === "confirmed" && (
              <motion.div
                className="absolute rounded-full border-2 border-emerald-400"
                initial={{ width: 140, height: 140, opacity: 1 }}
                animate={{ width: 380, height: 380, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            )}

            {/* Core disk */}
            <motion.div
              animate={{
                scale: phase === "confirmed" ? [1, 1.08, 1] : phase === "idle" ? 1 : 1.04,
                boxShadow:
                  phase === "confirmed"
                    ? "0 0 80px rgba(52,211,153,0.6)"
                    : phase === "idle"
                    ? "0 0 30px rgba(190,242,100,0.15)"
                    : "0 0 70px rgba(190,242,100,0.55)",
              }}
              transition={{ duration: 0.4 }}
              className={`size-36 rounded-full grid place-items-center font-display italic font-bold text-center leading-tight ${
                phase === "confirmed"
                  ? "bg-emerald-400 text-foreground"
                  : phase === "idle"
                  ? "bg-white/10 text-white/70 ring-1 ring-white/15"
                  : "bg-accent text-foreground"
              }`}
            >
              <AnimatePresence mode="wait">
                {active && phase !== "idle" ? (
                  <motion.div
                    key={`face-${active.id}-${phase}`}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <Avatar person={active} size={56} className="ring-2 ring-foreground/20" />
                    {phase === "confirmed" && (
                      <div className="text-[10px] uppercase tracking-widest">{active.name.split(" ")[0]} ✓</div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="nfc-icon"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    {/* NFC waves glyph */}
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="opacity-80">
                      <path d="M5 8c2 2 2 6 0 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M9 6c3.5 3 3.5 9 0 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M13 4c5 4 5 12 0 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="18" cy="12" r="1.4" fill="currentColor" />
                    </svg>
                    <div className="text-[9px] uppercase tracking-widest mt-1 opacity-70">tap to scan</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Hint + simulate */}
          <div className="flex items-center justify-between gap-3 relative">
            <div className="text-[11px] font-display italic text-white/60">
              {copy.hint}
              {active && phase === "reading" && (
                <span className="ml-2 text-white/30">· uid 04:{active.id.slice(-2).toUpperCase()}:A3:F1</span>
              )}
            </div>
            <button
              onClick={simulateScan}
              disabled={phase !== "idle"}
              className="px-4 py-2 bg-accent text-foreground rounded-xl font-bold text-xs hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Simulate tap ↺
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
